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
  members: new Map(),
  admin: mockClarity.tx.sender,
  
  // Read-only functions
  getMember: (memberId) => {
    return contract.members.get(memberId) || null;
  },
  
  isActiveMember: (memberId) => {
    const member = contract.members.get(memberId);
    return member ? member.status === 1 : false;
  },
  
  // Public functions
  registerMember: (memberId, name, location) => {
    if (mockClarity.tx.sender !== contract.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (contract.members.has(memberId)) {
      return { type: 'err', value: 100 };
    }
    
    contract.members.set(memberId, {
      principal: mockClarity.tx.sender,
      name,
      location,
      joinDate: mockClarity.block.height,
      status: 1
    });
    
    return { type: 'ok', value: true };
  },
  
  updateMemberStatus: (memberId, newStatus) => {
    if (mockClarity.tx.sender !== contract.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (newStatus !== 0 && newStatus !== 1) {
      return { type: 'err', value: 101 };
    }
    
    const member = contract.members.get(memberId);
    if (!member) {
      return { type: 'err', value: 404 };
    }
    
    member.status = newStatus;
    contract.members.set(memberId, member);
    
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

describe('Member Verification Contract', () => {
  beforeEach(() => {
    // Reset contract state before each test
    contract.members.clear();
    contract.admin = mockClarity.tx.sender;
  });
  
  it('should register a new member', () => {
    const result = contract.registerMember('FARM001', 'John Farmer', 'North Field');
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.members.has('FARM001')).toBe(true);
    
    const member = contract.members.get('FARM001');
    expect(member.name).toBe('John Farmer');
    expect(member.location).toBe('North Field');
    expect(member.status).toBe(1);
  });
  
  it('should not register a duplicate member', () => {
    contract.registerMember('FARM001', 'John Farmer', 'North Field');
    const result = contract.registerMember('FARM001', 'Jane Farmer', 'South Field');
    
    expect(result).toEqual({ type: 'err', value: 100 });
  });
  
  it('should update member status', () => {
    contract.registerMember('FARM001', 'John Farmer', 'North Field');
    const result = contract.updateMemberStatus('FARM001', 0);
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.members.get('FARM001').status).toBe(0);
  });
  
  it('should check if a member is active', () => {
    contract.registerMember('FARM001', 'John Farmer', 'North Field');
    expect(contract.isActiveMember('FARM001')).toBe(true);
    
    contract.updateMemberStatus('FARM001', 0);
    expect(contract.isActiveMember('FARM001')).toBe(false);
  });
  
  it('should change admin', () => {
    const newAdmin = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = contract.setAdmin(newAdmin);
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.admin).toBe(newAdmin);
  });
});

console.log('Member Verification Contract tests completed');
