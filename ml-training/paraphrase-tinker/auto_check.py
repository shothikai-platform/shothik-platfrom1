#!/usr/bin/env python3
"""
auto_check.py - Automatically check billing status every minute
"""

import os
import time
import sys

os.environ["TINKER_API_KEY"] = "tml-DWAH3U3DkjiuGcdZewOx023YYZ5eg605LyktnqVmesDhef0j4Qo019DVGOiOmvi3RAAAA"

from tinker import ServiceClient

print("🔄 Auto-checking Tinker billing status")
print("=" * 50)
print("Checking every 60 seconds...")
print("Press Ctrl+C to stop")
print("=" * 50)

attempt = 0
max_attempts = 30  # Check for 30 minutes

while attempt < max_attempts:
    attempt += 1
    print(f"\n⏰ Check #{attempt} at {time.strftime('%H:%M:%S')}")
    
    try:
        service = ServiceClient()
        
        try:
            client = service.create_lora_training_client(
                base_model="Qwen3-30B-A3B-Instruct",
            )
            print("✅✅✅ BILLING IS ACTIVE! ✅✅✅")
            print("\n🎉 Ready to train!")
            print("Run: python3 tinker_train_simple.py")
            sys.exit(0)
            
        except Exception as e:
            if "402" in str(e):
                print("⏳ Billing still processing...")
            else:
                print(f"⚠️  Error: {str(e)[:60]}")
                
    except Exception as e:
        print(f"❌ Connection error: {e}")
    
    if attempt < max_attempts:
        print(f"   Next check in 60 seconds...")
        time.sleep(60)

print("\n" + "=" * 50)
print("⏰ Max attempts reached (30 minutes)")
print("\nPossible issues:")
print("1. Payment method not verified")
print("2. Credit card declined")
print("3. Account needs manual approval")
print("\nContact: support@thinkingmachines.ai")
