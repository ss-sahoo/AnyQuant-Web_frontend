#!/usr/bin/env python3
"""
Test script to verify Custom Components API (Behaviors & Trade Management)
Similar to how Custom Indicators and Strategies work
"""

import requests
import json
from datetime import datetime

# API Configuration
BASE_URL = "https://anyquant.co.uk"
AUTH_TOKEN = None  # Will need to be set by user

class CustomComponentTester:
    def __init__(self, base_url, auth_token=None):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json"
        }
        if auth_token:
            self.headers["Authorization"] = f"Bearer {auth_token}"
    
    def test_list_custom_components(self):
        """Test: GET /api/custom-components/"""
        print("\n" + "="*60)
        print("TEST 1: List Custom Components")
        print("="*60)
        
        url = f"{self.base_url}/api/custom-components/"
        try:
            response = requests.get(url, headers=self.headers)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS: Found {len(data)} custom components")
                for comp in data:
                    print(f"  - {comp.get('name')} ({comp.get('type')})")
                return True, data
            elif response.status_code == 404:
                print("❌ FAILED: Endpoint not found (API not implemented)")
                return False, None
            else:
                print(f"❌ FAILED: {response.text}")
                return False, None
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return False, None
    
    def test_create_behavior(self):
        """Test: POST /api/custom-components/ (type: behavior)"""
        print("\n" + "="*60)
        print("TEST 2: Create Custom Behavior")
        print("="*60)
        
        url = f"{self.base_url}/api/custom-components/"
        
        # Sample behavior code
        behavior_code = """
class CustomBehavior:
    def __init__(self, params):
        self.max_trades = params.get('max_trades', 5)
        self.risk_per_trade = params.get('risk_per_trade', 0.02)
    
    def should_enter_trade(self, signal, portfolio):
        # Check if we've reached max trades
        if len(portfolio.open_positions) >= self.max_trades:
            return False
        return True
    
    def calculate_position_size(self, signal, portfolio):
        # Calculate position size based on risk
        account_value = portfolio.total_value
        risk_amount = account_value * self.risk_per_trade
        return risk_amount / signal.stop_loss_distance
"""
        
        payload = {
            "name": "Test Max Trades Behavior",
            "type": "behavior",
            "language": "python",
            "code": behavior_code,
            "parameters": {
                "max_trades": 5,
                "risk_per_trade": 0.02
            }
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                print(f"✅ SUCCESS: Created behavior with ID: {data.get('id')}")
                print(f"  Name: {data.get('name')}")
                print(f"  Type: {data.get('type')}")
                print(f"  Status: {data.get('status')}")
                return True, data
            elif response.status_code == 404:
                print("❌ FAILED: Endpoint not found (API not implemented)")
                return False, None
            else:
                print(f"❌ FAILED: {response.text}")
                return False, None
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return False, None
    
    def test_create_trade_management(self):
        """Test: POST /api/custom-components/ (type: trade_management)"""
        print("\n" + "="*60)
        print("TEST 3: Create Custom Trade Management")
        print("="*60)
        
        url = f"{self.base_url}/api/custom-components/"
        
        # Sample trade management code
        trade_mgmt_code = """
class CustomTradeManagement:
    def __init__(self, params):
        self.trailing_stop_pct = params.get('trailing_stop_pct', 0.02)
        self.take_profit_pct = params.get('take_profit_pct', 0.05)
    
    def update_stop_loss(self, position, current_price):
        # Implement trailing stop
        if position.side == 'long':
            new_stop = current_price * (1 - self.trailing_stop_pct)
            if new_stop > position.stop_loss:
                position.stop_loss = new_stop
        else:
            new_stop = current_price * (1 + self.trailing_stop_pct)
            if new_stop < position.stop_loss:
                position.stop_loss = new_stop
    
    def should_exit(self, position, current_price):
        # Check take profit
        profit_pct = (current_price - position.entry_price) / position.entry_price
        if position.side == 'long' and profit_pct >= self.take_profit_pct:
            return True, 'take_profit'
        elif position.side == 'short' and profit_pct <= -self.take_profit_pct:
            return True, 'take_profit'
        return False, None
"""
        
        payload = {
            "name": "Test Trailing Stop Management",
            "type": "trade_management",
            "language": "python",
            "code": trade_mgmt_code,
            "parameters": {
                "trailing_stop_pct": 0.02,
                "take_profit_pct": 0.05
            }
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                print(f"✅ SUCCESS: Created trade management with ID: {data.get('id')}")
                print(f"  Name: {data.get('name')}")
                print(f"  Type: {data.get('type')}")
                print(f"  Status: {data.get('status')}")
                return True, data
            elif response.status_code == 404:
                print("❌ FAILED: Endpoint not found (API not implemented)")
                return False, None
            else:
                print(f"❌ FAILED: {response.text}")
                return False, None
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return False, None
    
    def test_validate_code(self, code):
        """Test: POST /api/custom-components/validate/"""
        print("\n" + "="*60)
        print("TEST 4: Validate Component Code")
        print("="*60)
        
        url = f"{self.base_url}/api/custom-components/validate/"
        payload = {"code": code}
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS: Code validation passed")
                print(f"  Valid: {data.get('valid')}")
                if data.get('errors'):
                    print(f"  Errors: {data.get('errors')}")
                return True, data
            elif response.status_code == 404:
                print("❌ FAILED: Endpoint not found (API not implemented)")
                return False, None
            else:
                print(f"❌ FAILED: {response.text}")
                return False, None
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return False, None
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("\n" + "="*60)
        print("CUSTOM COMPONENTS API TEST SUITE")
        print("Testing Behaviors & Trade Management APIs")
        print("="*60)
        print(f"Base URL: {self.base_url}")
        print(f"Auth Token: {'Set' if self.headers.get('Authorization') else 'Not Set'}")
        
        results = {
            "list_components": self.test_list_custom_components(),
            "create_behavior": self.test_create_behavior(),
            "create_trade_management": self.test_create_trade_management(),
            "validate_code": self.test_validate_code("def test(): pass")
        }
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for success, _ in results.values() if success)
        total = len(results)
        
        for test_name, (success, _) in results.items():
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{test_name}: {status}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == 0:
            print("\n⚠️  WARNING: All tests failed!")
            print("This likely means the Custom Components API is NOT implemented yet.")
            print("\nThe frontend has the API calls defined in AllApiCalls.js:")
            print("  - listCustomComponents()")
            print("  - createCustomComponent()")
            print("  - getCustomComponent()")
            print("  - updateCustomComponent()")
            print("  - deleteCustomComponent()")
            print("  - validateCustomComponentCode()")
            print("  - activateCustomComponent()")
            print("\nBut the backend endpoints are missing.")
        elif passed < total:
            print("\n⚠️  Some tests failed. Check the details above.")
        else:
            print("\n✅ All tests passed! The API is working correctly.")
        
        return results


def main():
    print("="*60)
    print("Custom Components API Tester")
    print("Testing: Behaviors & Trade Management")
    print("="*60)
    
    # Note: User needs to provide auth token
    print("\n⚠️  NOTE: This test runs without authentication.")
    print("For full testing, you need to:")
    print("1. Login to get an auth token")
    print("2. Set AUTH_TOKEN variable in this script")
    print("3. Re-run the tests")
    
    tester = CustomComponentTester(BASE_URL, AUTH_TOKEN)
    results = tester.run_all_tests()
    
    return results


if __name__ == "__main__":
    main()
