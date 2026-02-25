#!/usr/bin/env python3
"""
check_billing.py - Check Tinker API billing status
"""

import os

os.environ["TINKER_API_KEY"] = "tml-DWAH3U3DkjiuGcdZewOx023YYZ5eg605LyktnqVmesDhef0j4Qo019DVGOiOmvi3RAAAA"

from tinker import ServiceClient

print("🔍 Checking Tinker API Billing Status")
print("=" * 50)

try:
    service = ServiceClient()
    print("✅ API Key: VALID")
    print("✅ Connection: SUCCESS")
    
    # Try to create a client (this will fail if billing is not set up)
    try:
        client = service.create_lora_training_client(
            base_model="Qwen3-30B-A3B-Instruct",
        )
        print("✅ Billing: ACTIVE")
        print("\n🎉 Ready to train!")
        print("Run: python3 tinker_train_simple.py")
        
    except Exception as e:
        if "402" in str(e) or "billing" in str(e).lower():
            print("❌ Billing: NOT ACTIVE")
            print("\n⚠️  Billing is still processing or not set up")
            print("\nNext steps:")
            print("1. Visit: https://tinker-console.thinkingmachines.ai/billing/balance")
            print("2. Verify payment method is added")
            print("3. Check that credits are available")
            print("4. Wait 2-3 minutes for processing")
            print("5. Run this check again")
        else:
            print(f"❌ Error: {e}")
            
except Exception as e:
    print(f"❌ Connection failed: {e}")
