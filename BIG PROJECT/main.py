import os
import json
import google.generativeai as genai
from PIL import Image
import base64
from io import BytesIO

# Configuration
WARDROBE_FILE = "wardrobe_data.json"
API_KEY_FILE = "gemini_api_key.txt"

class WardrobeAI:
    def __init__(self):
        self.wardrobe = self.load_wardrobe()
        self.setup_gemini()
    
    def setup_gemini(self):
        """Setup Gemini API"""
        if os.path.exists(API_KEY_FILE):
            with open(API_KEY_FILE, 'r') as f:
                api_key = f.read().strip()
        else:
            print("\n🔑 First time setup!")
            print("Get your free API key from: https://aistudio.google.com/app/apikey")
            api_key = input("Enter your Gemini API key: ").strip()
            with open(API_KEY_FILE, 'w') as f:
                f.write(api_key)
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def load_wardrobe(self):
        """Load wardrobe from local storage"""
        if os.path.exists(WARDROBE_FILE):
            with open(WARDROBE_FILE, 'r') as f:
                return json.load(f)
        return {"items": []}
    
    def save_wardrobe(self):
        """Save wardrobe to local storage"""
        with open(WARDROBE_FILE, 'w') as f:
            json.dump(self.wardrobe, f, indent=2)
    
    def add_clothing_items(self):
        """Add new clothing items to wardrobe"""
        print("\n👕 Let's add items to your wardrobe!")
        print("=" * 50)
        print("\nChoose upload method:")
        print("1. Upload from folder (batch)")
        print("2. Upload individual images")
        
        method = input("\nChoose (1 or 2): ").strip()
        
        if method == '1':
            self.batch_upload()
        else:
            self.individual_upload()
        
        self.save_wardrobe()
        print(f"\n🎉 Total items in wardrobe: {len(self.wardrobe['items'])}")
    
    def batch_upload(self):
        """Upload all images from a folder"""
        folder_path = input("\nEnter folder path with your wardrobe images: ").strip()
        
        if not os.path.exists(folder_path):
            print("❌ Folder not found!")
            return
        
        # Get all image files
        image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp')
        image_files = [f for f in os.listdir(folder_path) 
                      if f.lower().endswith(image_extensions)]
        
        if not image_files:
            print("❌ No images found in folder!")
            return
        
        print(f"\n📁 Found {len(image_files)} images!")
        print("Now let's label each one...\n")
        
        for img_file in image_files:
            image_path = os.path.join(folder_path, img_file)
            print(f"\n🖼️  Image: {img_file}")
            
            # Option to skip
            skip = input("Skip this image? (yes/no): ").strip().lower()
            if skip == 'yes':
                continue
            
            # Get clothing details
            item_type = input("Type (shirt/pants/dress/jacket/shoes/accessory): ").strip()
            color = input("Color: ").strip()
            style = input("Style (formal/casual/party/sporty): ").strip()
            
            # Store item
            item_id = len(self.wardrobe["items"]) + 1
            item = {
                "id": item_id,
                "image_path": image_path,
                "type": item_type,
                "color": color,
                "style": style
            }
            
            self.wardrobe["items"].append(item)
            print(f"✅ Added: {color} {item_type} ({style})")
    
    def individual_upload(self):
        """Upload images one by one"""
        while True:
            image_path = input("\nEnter image path (or 'done' to finish): ").strip()
            
            if image_path.lower() == 'done':
                break
            
            if not os.path.exists(image_path):
                print("❌ File not found. Please try again.")
                continue
            
            # Get clothing details
            item_type = input("What type of clothing is this? (e.g., shirt, pants, dress, jacket): ").strip()
            color = input("What color is it? ").strip()
            style = input("Style/description (e.g., formal, casual, party): ").strip()
            
            # Store item
            item_id = len(self.wardrobe["items"]) + 1
            item = {
                "id": item_id,
                "image_path": image_path,
                "type": item_type,
                "color": color,
                "style": style
            }
            
            self.wardrobe["items"].append(item)
            print(f"✅ Added: {color} {item_type} ({style})")
    
    def view_wardrobe(self):
        """Display current wardrobe"""
        if not self.wardrobe["items"]:
            print("\n📭 Your wardrobe is empty!")
            return
        
        print("\n👔 Your Wardrobe:")
        print("=" * 50)
        for item in self.wardrobe["items"]:
            print(f"ID {item['id']}: {item['color']} {item['type']} - {item['style']}")
    
    def get_outfit_suggestions(self):
        """Get AI-powered outfit suggestions"""
        if not self.wardrobe["items"]:
            print("\n❌ Please add items to your wardrobe first!")
            return
        
        print("\n🎯 Let's find the perfect outfit!")
        print("=" * 50)
        
        # Get event details
        event = input("\nWhere are you going? (e.g., wedding, office, party, date, casual hangout): ").strip()
        weather = input("What's the weather like? (e.g., hot, cold, rainy): ").strip()
        mood = input("Any specific vibe you want? (e.g., professional, trendy, comfortable): ").strip()
        
        # Prepare wardrobe description
        wardrobe_desc = "Here's the wardrobe:\n"
        for item in self.wardrobe["items"]:
            wardrobe_desc += f"- {item['color']} {item['type']} ({item['style']})\n"
        
        # Create prompt for Gemini
        prompt = f"""You are a Gen-Z fashion stylist for a thrift store app. 

{wardrobe_desc}

The user is going to: {event}
Weather: {weather}
Desired vibe: {mood}

Suggest 2-3 outfit combinations from their wardrobe. For each combination:
1. List the specific items to wear together
2. Explain why this combo works for the occasion
3. Add a fun Gen-Z style tip or emoji

Be enthusiastic, trendy, and helpful! Use Gen-Z language and emojis."""

        print("\n🤖 AI is thinking...\n")
        
        try:
            response = self.model.generate_content(prompt)
            print("💡 OUTFIT SUGGESTIONS:")
            print("=" * 50)
            print(response.text)
            print("=" * 50)
        except Exception as e:
            print(f"❌ Error getting suggestions: {e}")
            print("Make sure your API key is valid and you have internet connection.")
    
    def clear_wardrobe(self):
        """Clear all wardrobe items"""
        confirm = input("\n⚠️  Are you sure you want to clear your entire wardrobe? (yes/no): ").strip().lower()
        if confirm == 'yes':
            self.wardrobe = {"items": []}
            self.save_wardrobe()
            print("✅ Wardrobe cleared!")
        else:
            print("❌ Cancelled.")
    
    def run(self):
        """Main chatbot loop"""
        print("\n" + "=" * 50)
        print("👗 THRIFT STORE - Wardrobe AI Assistant 👔")
        print("=" * 50)
        print("Your personal Gen-Z fashion stylist!")
        
        while True:
            print("\n📱 MENU:")
            print("1. Add clothing items")
            print("2. View wardrobe")
            print("3. Get outfit suggestions")
            print("4. Clear wardrobe")
            print("5. Exit")
            
            choice = input("\nChoose an option (1-5): ").strip()
            
            if choice == '1':
                self.add_clothing_items()
            elif choice == '2':
                self.view_wardrobe()
            elif choice == '3':
                self.get_outfit_suggestions()
            elif choice == '4':
                self.clear_wardrobe()
            elif choice == '5':
                print("\n👋 Thanks for using Thrift Store! Stay stylish! ✨")
                break
            else:
                print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    bot = WardrobeAI()
    bot.run()