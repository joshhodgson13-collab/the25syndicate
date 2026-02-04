#!/usr/bin/env python3
"""
Comprehensive backend API testing for The 2.5 Syndicate football betting app
Tests all authentication, admin, betting, and payment endpoints
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class SyndicateAPITester:
    def __init__(self, base_url: str = "https://syndicatebets.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.user_data = None
        self.admin_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None, use_admin: bool = False) -> tuple[bool, Dict, int]:
        """Make HTTP request and return success, response data, status code"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        # Set up headers
        req_headers = {'Content-Type': 'application/json'}
        if headers:
            req_headers.update(headers)
        
        # Add auth token if available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            req_headers['Authorization'] = f'Bearer {token}'

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}, 0

            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            return response.status_code < 400, response_data, response.status_code

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        success, data, status = self.make_request('GET', '/')
        expected_message = "The 2.5 Syndicate API"
        
        if success and data.get('message') == expected_message:
            self.log_test("Basic API Connectivity", True)
            return True
        else:
            self.log_test("Basic API Connectivity", False, 
                         f"Expected message '{expected_message}', got: {data}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }

        success, data, status = self.make_request('POST', '/auth/register', test_user)
        
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.user_data = data['user']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not self.user_data:
            self.log_test("User Login", False, "No user data available")
            return False

        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }

        success, data, status = self.make_request('POST', '/auth/login', login_data)
        
        if success and 'token' in data:
            self.log_test("User Login", True)
            return True
        else:
            self.log_test("User Login", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        success, data, status = self.make_request('GET', '/auth/me')
        
        if success and 'id' in data and 'email' in data:
            self.log_test("Get User Profile", True)
            return True
        else:
            self.log_test("Get User Profile", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_admin_verification(self):
        """Test admin code verification"""
        admin_code = {"code": "syndicate2024"}
        success, data, status = self.make_request('POST', '/admin/verify', admin_code)
        
        if success and data.get('success'):
            self.admin_token = self.token  # Same user, now with admin privileges
            self.log_test("Admin Verification", True)
            return True
        else:
            self.log_test("Admin Verification", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_create_bet(self):
        """Test creating a new bet (admin only)"""
        if not self.admin_token:
            self.log_test("Create Bet", False, "No admin token available")
            return False

        # Create a bet for today
        kick_off_time = datetime.now(timezone.utc).replace(hour=15, minute=0, second=0, microsecond=0)
        
        bet_data = {
            "home_team": "Manchester United",
            "away_team": "Liverpool",
            "league": "Premier League",
            "bet_type": "Over 2.5",
            "odds": 1.85,
            "stake": 7,
            "kick_off": kick_off_time.isoformat(),
            "is_vip": False
        }

        success, data, status = self.make_request('POST', '/admin/bets', bet_data, use_admin=True)
        
        if success and 'id' in data:
            self.created_bet_id = data['id']
            self.log_test("Create Bet", True)
            return True
        else:
            self.log_test("Create Bet", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_get_today_bets(self):
        """Test getting today's public bets"""
        success, data, status = self.make_request('GET', '/bets/today')
        
        if success and isinstance(data, list):
            self.log_test("Get Today's Bets", True)
            return True
        else:
            self.log_test("Get Today's Bets", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_get_results(self):
        """Test getting bet results"""
        success, data, status = self.make_request('GET', '/bets/results')
        
        if success and isinstance(data, list):
            self.log_test("Get Results", True)
            return True
        else:
            self.log_test("Get Results", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_get_stats(self):
        """Test getting betting statistics"""
        success, data, status = self.make_request('GET', '/stats')
        
        expected_fields = ['total_bets', 'won_bets', 'lost_bets', 'win_rate']
        if success and all(field in data for field in expected_fields):
            self.log_test("Get Stats", True)
            return True
        else:
            self.log_test("Get Stats", False, 
                         f"Status: {status}, Missing fields in: {data}")
            return False

    def test_update_bet_result(self):
        """Test updating bet result (admin only)"""
        if not hasattr(self, 'created_bet_id') or not self.admin_token:
            self.log_test("Update Bet Result", False, "No bet ID or admin token")
            return False

        update_data = {
            "status": "won",
            "home_score": 3,
            "away_score": 1
        }

        success, data, status = self.make_request(
            'PUT', f'/admin/bets/{self.created_bet_id}', update_data, use_admin=True
        )
        
        if success and data.get('status') == 'won':
            self.log_test("Update Bet Result", True)
            return True
        else:
            self.log_test("Update Bet Result", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_get_admin_bets(self):
        """Test getting all bets (admin only)"""
        if not self.admin_token:
            self.log_test("Get Admin Bets", False, "No admin token")
            return False

        success, data, status = self.make_request('GET', '/admin/bets', use_admin=True)
        
        if success and isinstance(data, list):
            self.log_test("Get Admin Bets", True)
            return True
        else:
            self.log_test("Get Admin Bets", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_vip_endpoints_unauthorized(self):
        """Test VIP endpoints without VIP access (should fail)"""
        success, data, status = self.make_request('GET', '/bets/vip/today')
        
        # Should fail with 403 since user is not VIP
        if not success and status == 403:
            self.log_test("VIP Endpoints (Unauthorized)", True)
            return True
        else:
            self.log_test("VIP Endpoints (Unauthorized)", False, 
                         f"Expected 403, got {status}: {data}")
            return False

    def test_stripe_checkout_creation(self):
        """Test Stripe checkout session creation"""
        if not self.token:
            self.log_test("Stripe Checkout Creation", False, "No user token")
            return False

        checkout_data = {"origin_url": "https://syndicatebets.preview.emergentagent.com"}
        success, data, status = self.make_request('POST', '/checkout/create', checkout_data)
        
        if success and 'url' in data and 'session_id' in data:
            self.checkout_session_id = data['session_id']
            self.log_test("Stripe Checkout Creation", True)
            return True
        else:
            self.log_test("Stripe Checkout Creation", False, 
                         f"Status: {status}, Response: {data}")
            return False

    def test_invalid_admin_code(self):
        """Test admin verification with invalid code"""
        invalid_code = {"code": "wrongcode"}
        success, data, status = self.make_request('POST', '/admin/verify', invalid_code)
        
        # Should fail with 403
        if not success and status == 403:
            self.log_test("Invalid Admin Code", True)
            return True
        else:
            self.log_test("Invalid Admin Code", False, 
                         f"Expected 403, got {status}: {data}")
            return False

    def test_unauthorized_admin_endpoints(self):
        """Test admin endpoints without admin privileges"""
        # Create a new user without admin privileges
        timestamp = datetime.now().strftime("%H%M%S")
        regular_user = {
            "email": f"regular_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Regular User {timestamp}"
        }

        success, data, status = self.make_request('POST', '/auth/register', regular_user)
        if not success:
            self.log_test("Unauthorized Admin Endpoints", False, "Failed to create regular user")
            return False

        regular_token = data['token']
        
        # Try to access admin endpoint
        bet_data = {
            "home_team": "Test Team 1",
            "away_team": "Test Team 2",
            "league": "Test League",
            "bet_type": "Over 2.5",
            "odds": 2.0,
            "stake": 5,
            "kick_off": datetime.now(timezone.utc).isoformat(),
            "is_vip": False
        }

        headers = {'Authorization': f'Bearer {regular_token}'}
        success, data, status = self.make_request('POST', '/admin/bets', bet_data, headers=headers)
        
        # Should fail with 403
        if not success and status == 403:
            self.log_test("Unauthorized Admin Endpoints", True)
            return True
        else:
            self.log_test("Unauthorized Admin Endpoints", False, 
                         f"Expected 403, got {status}: {data}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting The 2.5 Syndicate Backend API Tests")
        print("=" * 60)

        # Basic connectivity
        if not self.test_basic_connectivity():
            print("❌ Basic connectivity failed. Stopping tests.")
            return False

        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_profile()

        # Admin tests
        self.test_admin_verification()
        self.test_invalid_admin_code()
        self.test_unauthorized_admin_endpoints()

        # Betting functionality
        self.test_create_bet()
        self.test_get_today_bets()
        self.test_get_results()
        self.test_get_stats()
        self.test_update_bet_result()
        self.test_get_admin_bets()

        # VIP and payment tests
        self.test_vip_endpoints_unauthorized()
        self.test_stripe_checkout_creation()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

    def get_failed_tests(self):
        """Get list of failed tests"""
        return [test for test in self.test_results if not test['success']]

def main():
    """Main test execution"""
    tester = SyndicateAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Print failed tests details
        failed_tests = tester.get_failed_tests()
        if failed_tests:
            print("\n❌ Failed Tests Details:")
            for test in failed_tests:
                print(f"  • {test['name']}: {test['details']}")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())