import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  tx: {
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  },
  block: {
    height: 100,
  },
};

// Mock the contract functions
const contract = {
  purchaseOrders: new Map(),
  contributions: new Map(),
  admin: mockClarity.tx.sender,
  
  // Read-only functions
  getPurchaseOrder: (orderId) => {
    return contract.purchaseOrders.get(orderId) || null;
  },
  
  getContribution: (orderId, memberId) => {
    const key = `${orderId}-${memberId}`;
    return contract.contributions.get(key) || null;
  },
  
  // Public functions
  createPurchaseOrder: (orderId, itemName, quantity, totalCost) => {
    if (mockClarity.tx.sender !== contract.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (contract.purchaseOrders.has(orderId)) {
      return { type: 'err', value: 100 };
    }
    
    contract.purchaseOrders.set(orderId, {
      itemName,
      quantity,
      totalCost,
      status: 0, // pending
      creationDate: mockClarity.block.height
    });
    
    return { type: 'ok', value: true };
  },
  
  contributeToOrder: (orderId, memberId, amount, quantityShare) => {
    const order = contract.purchaseOrders.get(orderId);
    if (!order) {
      return { type: 'err', value: 404 };
    }
    
    if (order.status !== 0) {
      return { type: 'err', value: 102 };
    }
    
    const key = `${orderId}-${memberId}`;
    contract.contributions.set(key, {
      amount,
      quantityShare,
      contributionDate: mockClarity.block.height
    });
    
    return { type: 'ok', value: true };
  },
  
  updateOrderStatus: (orderId, newStatus) => {
    if (mockClarity.tx.sender !== contract.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (newStatus > 3) {
      return { type: 'err', value: 101 };
    }
    
    const order = contract.purchaseOrders.get(orderId);
    if (!order) {
      return { type: 'err', value: 404 };
    }
    
    order.status = newStatus;
    contract.purchaseOrders.set(orderId, order);
    
    return { type: 'ok', value: true };
  },
  
  setAdmin: (newAdmin) => {
    if (mockClarity.tx.sender !== contract.admin) {
      return { type: 'err', value: 403 };
    }
    
    contract.admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Collective Purchasing Contract', () => {
  beforeEach(() => {
    // Reset contract state before each test
    contract.purchaseOrders.clear();
    contract.contributions.clear();
    contract.admin = mockClarity.tx.sender;
  });
  
  it('should create a purchase order', () => {
    const result = contract.createPurchaseOrder('ORDER001', 'Fertilizer', 1000, 5000);
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.purchaseOrders.has('ORDER001')).toBe(true);
    
    const order = contract.purchaseOrders.get('ORDER001');
    expect(order.itemName).toBe('Fertilizer');
    expect(order.quantity).toBe(1000);
    expect(order.totalCost).toBe(5000);
    expect(order.status).toBe(0);
  });
  
  it('should not create a duplicate purchase order', () => {
    contract.createPurchaseOrder('ORDER001', 'Fertilizer', 1000, 5000);
    const result = contract.createPurchaseOrder('ORDER001', 'Seeds', 500, 2000);
    
    expect(result).toEqual({ type: 'err', value: 100 });
  });
  
  it('should allow contributions to an order', () => {
    contract.createPurchaseOrder('ORDER001', 'Fertilizer', 1000, 5000);
    const result = contract.contributeToOrder('ORDER001', 'FARM001', 1000, 200);
    
    expect(result).toEqual({ type: 'ok', value: true });
    
    const contribution = contract.getContribution('ORDER001', 'FARM001');
    expect(contribution.amount).toBe(1000);
    expect(contribution.quantityShare).toBe(200);
  });
  
  it('should not allow contributions to non-existent orders', () => {
    const result = contract.contributeToOrder('INVALID', 'FARM001', 1000, 200);
    expect(result).toEqual({ type: 'err', value: 404 });
  });
  
  it('should update order status', () => {
    contract.createPurchaseOrder('ORDER001', 'Fertilizer', 1000, 5000);
    const result = contract.updateOrderStatus('ORDER001', 1);
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.purchaseOrders.get('ORDER001').status).toBe(1);
  });
  
  it('should not allow contributions to orders that are not pending', () => {
    contract.createPurchaseOrder('ORDER001', 'Fertilizer', 1000, 5000);
    contract.updateOrderStatus('ORDER001', 1);
    
    const result = contract.contributeToOrder('ORDER001', 'FARM001', 1000, 200);
    expect(result).toEqual({ type: 'err', value: 102 });
  });
});

console.log('Collective Purchasing Contract tests completed');
