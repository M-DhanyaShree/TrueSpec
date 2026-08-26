"""
Generates the raw datasets matching the exact specified schema for TrueSpec:
1. data/raw/Laptop_Train_v2.csv (SemEval style sentiment dataset)
2. data/raw/laptops_dataset_final_600.csv (600 laptop reviews with realistic distribution)
"""
import os
import csv
import random

os.makedirs('data/raw', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)

# 1. Generate Laptop_Train_v2.csv
train_sentences = [
    # Positive
    ("The battery life on this machine easily lasts 14 hours of continuous browsing.", "battery life", "positive"),
    ("The M3 Pro chip delivers blazing fast video rendering in DaVinci Resolve.", "M3 Pro chip", "positive"),
    ("OLED display with 120Hz refresh rate is vivid, ultra sharp, and stunning.", "OLED display", "positive"),
    ("Keyboard has great tactile travel and comfortable spacing for long typing sessions.", "Keyboard", "positive"),
    ("Trackpad is smooth, precise, and supports all multi-touch gestures seamlessly.", "Trackpad", "positive"),
    ("Build quality is rock solid with premium aluminum unibody construction.", "Build quality", "positive"),
    ("Speakers are surprisingly loud with deep bass and crystal clear treble.", "Speakers", "positive"),
    ("Lightweight design makes it effortless to carry in a backpack for daily commute.", "Lightweight design", "positive"),
    ("Thermals remain cool and whisper quiet even under sustained coding loads.", "Thermals", "positive"),
    ("NVIDIA RTX 4070 runs Cyberpunk 2077 at ultra settings smoothly above 80 FPS.", "NVIDIA RTX 4070", "positive"),
    ("The 32GB RAM handles multiple Docker containers and VMs without stuttering.", "RAM", "positive"),
    ("Instant wake from sleep and snappy biometric fingerprint login.", "wake from sleep", "positive"),
    ("Great value for money considering the high-end specifications.", "value for money", "positive"),
    ("The 1TB NVMe SSD provides lightning fast boot times and file transfers.", "SSD", "positive"),
    ("Webcam 1080p resolution provides crisp video quality for Zoom calls.", "Webcam", "positive"),
    ("Anti-glare screen coating works wonderfully under direct sunlight.", "Anti-glare screen", "positive"),
    ("Ports selection is generous with dual Thunderbolt 4 and full HDMI.", "Ports selection", "positive"),
    ("Fan noise is virtually non-existent during everyday web browsing and office work.", "Fan noise", "positive"),
    ("Fast charging replenishes 50% battery in just 30 minutes.", "Fast charging", "positive"),
    ("The hinge is sturdy with zero screen wobble when typing vigorously.", "hinge", "positive"),
    
    # Negative
    ("Battery drains rapidly, barely surviving 3 hours off the charger.", "Battery", "negative"),
    ("Fans get obnoxiously loud like a jet engine during light multitasking.", "Fans", "negative"),
    ("Keyboard feels mushy with shallow key travel and cramped arrow keys.", "Keyboard", "negative"),
    ("Display brightness is dim and colors look washed out in daylight.", "Display brightness", "negative"),
    ("Trackpad clicks feel loose and jumpy with poor palm rejection.", "Trackpad", "negative"),
    ("Lacks sufficient ports, forcing me to carry a dongle everywhere.", "ports", "negative"),
    ("Cheap plastic chassis flexes easily when pressing on the palm rest.", "plastic chassis", "negative"),
    ("Thermal throttling severely limits CPU performance after 10 minutes.", "Thermal throttling", "negative"),
    ("Overpriced for the underwhelming hardware components included.", "price", "negative"),
    ("Speakers sound tinny, hollow, and distort heavily at higher volumes.", "Speakers", "negative"),
    ("Bloatware pre-installed by the manufacturer slowed down initial setup.", "Bloatware", "negative"),
    ("Webcam produces grainy, dark video footage in standard indoor lighting.", "Webcam", "negative"),
    ("Power adapter brick is huge, bulky, and difficult to pack.", "Power adapter", "negative"),
    ("RAM is soldered to the motherboard and cannot be upgraded later.", "RAM", "negative"),
    ("Screen glare and reflections are unbearable outdoors.", "Screen glare", "negative"),
    ("Bluetooth connectivity frequently drops connection to wireless headphones.", "Bluetooth", "negative"),
    ("Coil whine noise is noticeable when plugged into the charger.", "Coil whine", "negative"),
    ("Customer support was unresponsive when attempting to file a warranty claim.", "Customer support", "negative"),
    ("Hinges feel fragile and make creaking noises when opening the lid.", "Hinges", "negative"),
    ("Weight is too heavy at nearly 3kg to carry comfortably for school.", "Weight", "negative"),
    
    # Neutral
    ("The laptop comes with Windows 11 Home pre-installed out of the box.", "Windows 11", "neutral"),
    ("Screen size measures 14 inches diagonally with a 16:10 aspect ratio.", "Screen size", "neutral"),
    ("Includes standard USB-A and USB-C ports on the left side.", "USB-A and USB-C ports", "neutral"),
    ("Chassis is made of a combination of polycarbonate and aluminum alloy.", "Chassis", "neutral"),
    ("The packaging includes a 65W USB-PD power supply and cable.", "power supply", "neutral"),
    ("Display uses an IPS LCD panel running at 60Hz refresh rate.", "IPS LCD panel", "neutral"),
    ("Weight is approximately 1.5 kilograms according to the spec sheet.", "Weight", "neutral"),
    ("Keyboard layout includes dedicated function keys and media shortcuts.", "Keyboard layout", "neutral"),
    ("Device supports Wi-Fi 6E and Bluetooth 5.3 wireless standards.", "Wi-Fi 6E", "neutral"),
    ("Comes with a 1-year limited manufacturer hardware warranty.", "warranty", "neutral"),
    
    # Conflict (mixed positive + negative aspects in one sentence)
    ("The display is gorgeous and vibrant, but the battery life is surprisingly poor.", "display", "conflict"),
    ("Fantastic CPU performance, though the cooling fans sound like a vacuum cleaner.", "CPU performance", "conflict"),
    ("Premium unibody metal build, yet the price tag is extremely hard to justify.", "build", "conflict"),
    ("Great lightweight form factor, however the keyboard lacks key travel depth.", "form factor", "conflict"),
    ("Crisp 4K resolution screen, but it severely degrades the overall battery runtime.", "screen", "conflict"),
    ("Blazing fast gaming frame rates, but the power brick is uncomfortably heavy.", "gaming frame rates", "conflict"),
]

# Expand training set to ~600 rows with variations
train_rows = []
row_id = 1
for base_sentence, aspect, polarity in train_sentences:
    # Add base
    from_pos = base_sentence.find(aspect)
    to_pos = from_pos + len(aspect) if from_pos != -1 else 0
    train_rows.append([row_id, base_sentence, aspect, polarity, max(0, from_pos), to_pos])
    row_id += 1

# Generate synthetic variations to reach a robust dataset
variations = [
    ("The {aspect} performs exceptionally well for my daily tasks.", "positive"),
    ("I am thoroughly impressed by how reliable the {aspect} is.", "positive"),
    ("Truly top notch {aspect}, worth every penny.", "positive"),
    ("The {aspect} exceeded my expectations in every way.", "positive"),
    ("Terrible quality {aspect}, totally unusable.", "negative"),
    ("I am very disappointed with the poor {aspect}.", "negative"),
    ("The {aspect} failed after only two weeks of use.", "negative"),
    ("Subpar {aspect}, expected much better at this price tier.", "negative"),
    ("The {aspect} is standard and functions as described.", "neutral"),
    ("The specifications list {aspect} as standard configuration.", "neutral"),
    ("The {aspect} is great but the overall experience has flaws.", "conflict"),
]

aspects = ["battery life", "cooling fan", "OLED screen", "keyboard", "trackpad", "GPU performance", "CPU speed", "chassis build", "speaker volume", "Thunderbolt port", "webcam quality", "Wi-Fi range", "RAM capacity", "SSD speed", "weight", "hinge mechanism"]

random.seed(42)
for i in range(500):
    templ, pol = random.choice(variations)
    asp = random.choice(aspects)
    sent = templ.format(aspect=asp)
    from_pos = sent.find(asp)
    to_pos = from_pos + len(asp) if from_pos != -1 else 0
    train_rows.append([row_id, sent, asp, pol, max(0, from_pos), to_pos])
    row_id += 1

with open('data/raw/Laptop_Train_v2.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'Sentence', 'Aspect Term', 'polarity', 'from', 'to'])
    writer.writerows(train_rows)

print(f"Generated data/raw/Laptop_Train_v2.csv with {len(train_rows)} samples.")


# 2. Generate data/raw/laptops_dataset_final_600.csv
# 600 reviews with realistic distributions matching laptops from laptops_cleaned.csv

laptops_for_reviews = [
    {"brand": "Apple", "model": "MacBook Air M2", "fullName": "Apple MacBook Air M2 13.6-inch Laptop", "rating_bias": 4.7},
    {"brand": "Apple", "model": "MacBook Air M3", "fullName": "Apple MacBook Air M3 13.6 Liquid Retina", "rating_bias": 4.8},
    {"brand": "Apple", "model": "MacBook Pro 14 M3 Pro", "fullName": "Apple MacBook Pro 14-inch M3 Pro", "rating_bias": 4.9},
    {"brand": "Apple", "model": "MacBook Pro 16 M3 Max", "fullName": "Apple MacBook Pro 16 M3 Max Workstation", "rating_bias": 4.9},
    {"brand": "Dell", "model": "XPS 13 9340", "fullName": "Dell XPS 13 9340 Intel Ultra 7", "rating_bias": 4.3},
    {"brand": "Dell", "model": "XPS 15 9530", "fullName": "Dell XPS 15 9530 Core i7 RTX 4060", "rating_bias": 4.5},
    {"brand": "Dell", "model": "Inspiron 15 3520", "fullName": "Dell Inspiron 15 3520 Laptop", "rating_bias": 3.8},
    {"brand": "Dell", "model": "Alienware m16 R2", "fullName": "Dell Alienware m16 R2 Gaming Laptop", "rating_bias": 4.4},
    {"brand": "Dell", "model": "Latitude 5440", "fullName": "Dell Latitude 5440 Business Notebook", "rating_bias": 4.2},
    {"brand": "Lenovo", "model": "ThinkPad X1 Carbon Gen 11", "fullName": "Lenovo ThinkPad X1 Carbon Gen 11 Ultrabook", "rating_bias": 4.8},
    {"brand": "Lenovo", "model": "Legion Pro 7i Gen 8", "fullName": "Lenovo Legion Pro 7i Gen 8 RTX 4080", "rating_bias": 4.8},
    {"brand": "Lenovo", "model": "IdeaPad Slim 5 16", "fullName": "Lenovo IdeaPad Slim 5 16 AMD Ryzen 5", "rating_bias": 4.2},
    {"brand": "Lenovo", "model": "Yoga 9i 2-in-1 14", "fullName": "Lenovo Yoga 9i 2-in-1 14-inch OLED", "rating_bias": 4.6},
    {"brand": "Lenovo", "model": "LOQ 15IRH8", "fullName": "Lenovo LOQ 15IRH8 Gaming Laptop RTX 4050", "rating_bias": 4.1},
    {"brand": "HP", "model": "Spectre x360 14 2024", "fullName": "HP Spectre x360 14 2024 2-in-1 OLED", "rating_bias": 4.7},
    {"brand": "HP", "model": "Envy x360 15", "fullName": "HP Envy x360 15 Touchscreen Laptop", "rating_bias": 4.1},
    {"brand": "HP", "model": "OMEN 16 2023", "fullName": "HP OMEN 16 2023 Gaming Laptop RTX 4060", "rating_bias": 4.3},
    {"brand": "HP", "model": "Pavilion Plus 14", "fullName": "HP Pavilion Plus 14 AMD OLED", "rating_bias": 4.3},
    {"brand": "HP", "model": "Dragonfly Pro", "fullName": "HP Dragonfly Pro AMD Ryzen 7", "rating_bias": 4.5},
    {"brand": "ASUS", "model": "ROG Zephyrus G14 2024", "fullName": "ASUS ROG Zephyrus G14 2024 Gaming Laptop", "rating_bias": 4.8},
    {"brand": "ASUS", "model": "Zenbook 14 OLED UX3405", "fullName": "ASUS Zenbook 14 OLED UX3405 Ultra 7", "rating_bias": 4.7},
    {"brand": "ASUS", "model": "TUF Gaming A15", "fullName": "ASUS TUF Gaming A15 Ryzen RTX 4050", "rating_bias": 4.2},
    {"brand": "ASUS", "model": "Vivobook Pro 15 OLED", "fullName": "ASUS Vivobook Pro 15 OLED RTX 4050", "rating_bias": 4.4},
    {"brand": "ASUS", "model": "ROG Strix SCAR 16", "fullName": "ASUS ROG Strix SCAR 16 RTX 4090", "rating_bias": 4.9},
    {"brand": "Acer", "model": "Swift Go 14 OLED", "fullName": "Acer Swift Go 14 OLED Ultra 5", "rating_bias": 4.3},
    {"brand": "Acer", "model": "Predator Helios 16", "fullName": "Acer Predator Helios 16 RTX 4070", "rating_bias": 4.4},
    {"brand": "Acer", "model": "Aspire 5 A515", "fullName": "Acer Aspire 5 A515 Budget Notebook", "rating_bias": 3.7},
    {"brand": "Acer", "model": "Nitro 16", "fullName": "Acer Nitro 16 Gaming Laptop RTX 4060", "rating_bias": 4.2},
    {"brand": "MSI", "model": "Stealth 16 Studio", "fullName": "MSI Stealth 16 Studio Creator Laptop", "rating_bias": 4.5},
    {"brand": "MSI", "model": "Raider GE78 HX", "fullName": "MSI Raider GE78 HX Gaming Monster", "rating_bias": 4.7},
    {"brand": "MSI", "model": "Modern 14 C12M", "fullName": "MSI Modern 14 C12M Slim Everyday", "rating_bias": 3.9},
    {"brand": "Razer", "model": "Blade 14 2024", "fullName": "Razer Blade 14 2024 Compact Gaming", "rating_bias": 4.6},
    {"brand": "Razer", "model": "Blade 16 2024", "fullName": "Razer Blade 16 2024 OLED Gaming", "rating_bias": 4.7},
    {"brand": "Microsoft", "model": "Surface Laptop 5 13.5", "fullName": "Microsoft Surface Laptop 5 13.5 Touchscreen", "rating_bias": 4.3},
    {"brand": "Microsoft", "model": "Surface Pro 9", "fullName": "Microsoft Surface Pro 9 2-in-1 Tablet Laptop", "rating_bias": 4.4},
    {"brand": "Samsung", "model": "Galaxy Book4 Pro 360", "fullName": "Samsung Galaxy Book4 Pro 360 AMOLED", "rating_bias": 4.6}
]

genuine_positive_templates = [
    ("Best laptop I have ever owned", "The battery life easily gets me through a full 10-hour workday without needing a charger. The screen is gorgeous and crisp, and typing on the keyboard is an absolute joy. Highly recommended for students and professionals alike."),
    ("Incredible performance and build quality", "I was hesitant switching from my older machine, but this model blew me away. Compiling large codebases in Rust and TypeScript is instantaneous. Thermals remain cool and the unibody chassis feels rock solid."),
    ("Superb display and battery runtime", "The OLED panel has astonishing contrast with true deep blacks. Video playback looks incredible, and the speakers produce clear, rich audio. Very impressed with the build."),
    ("Fast, quiet, and reliable daily driver", "Been using it for two months now for remote work, spreadsheet modeling, and web browsing. Whisper quiet operation and handles 30+ Chrome tabs without breaking a sweat."),
    ("Phenomenal gaming frame rates", "Runs all modern AAA titles on high settings effortlessly. DLSS keeps frame rates silky smooth above 90fps. Cooling system keeps thermals in check during long sessions.")
]

genuine_neutral_templates = [
    ("Decent laptop for the price", "Build quality is average and the keyboard takes some getting used to, but it gets everyday jobs done well enough. Nothing special, but reliable for regular home use."),
    ("Good machine with a few caveats", "Performance is solid and boots up quickly. However, the fan gets slightly noisy when charging and the webcam quality is just standard 720p. Fair value overall."),
    ("Satisfactory for everyday work", "It fulfills basic productivity needs. Battery lasts around 6-7 hours. Screen is bright enough indoors though reflective outdoors.")
]

genuine_negative_templates = [
    ("Battery life is very disappointing", "The advertised battery runtime does not match reality. Off the charger it drops dead in less than 3.5 hours during basic word processing. Very frustrating for travel."),
    ("Loud fan noise and excessive heat", "Whenever I open a couple of applications the fans spin up to maximum volume and the bottom plate gets uncomfortably hot to keep on my lap. Would not buy again."),
    ("Poor build quality and buggy trackpad", "The trackpad regularly registers false clicks and the hinge began squeaking within three weeks. Expected much better durability for this price point.")
]

# Suspicious / Fake review templates that will trigger heuristics:
# Heuristics:
# 1. Under ~20 words
# 2. Duplicate review text within same laptop
# 3. Promotional link
# 4. Excessive capitalization (>50% uppercase on >=20 chars)
# 5. Excessive punctuation (!!!, ???)
# Threshold: >= 2 heuristics triggers is_flagged = True

fake_templates = [
    # Heuristic 1 (short < 20 words) + Heuristic 5 (excessive punctuation !!!) -> 2 heuristics -> FLAGGED
    ("AMAZING DEAL!!!", "BEST LAPTOP EVER BUY IT NOW!!! REALLY LOVE IT SO MUCH WOW AMAZING VALUE RECOMMEND TO EVERYONE!!!!!!"),
    # Heuristic 3 (promotional link) + Heuristic 1 (<20 words) -> 2 heuristics -> FLAGGED
    ("Cheapest discount here", "Get exclusive 50% discount at http://best-laptop-deals-now.com/promo today only!"),
    # Heuristic 4 (all caps) + Heuristic 5 (excessive exclamation) -> 2 heuristics -> FLAGGED
    ("UNBELIEVABLE QUALITY MUST BUY", "THIS IS ABSOLUTELY THE BEST PURCHASE I HAVE EVER MADE IN MY ENTIRE LIFE DO NOT HESITATE TO BUY THIS RIGHT NOW!!!!!!!!"),
    # Heuristic 1 (< 20 words) + Duplicate text (will be inserted 3 times for same laptop) -> 2 heuristics -> FLAGGED
    ("Good product", "Very nice laptop working fine good battery.")
]

reviews_data = []
total_target = 600
reviews_per_laptop = total_target // len(laptops_for_reviews)

for laptop in laptops_for_reviews:
    # 85% genuine, 15% suspicious/edge reviews
    for i in range(reviews_per_laptop):
        r_type = random.random()
        overall_rating = round(laptop["rating_bias"], 1)
        no_ratings = random.randint(150, 1200)
        no_reviews = random.randint(80, 600)
        
        if r_type < 0.65: # genuine positive
            t, rev = random.choice(genuine_positive_templates)
            rating = random.choice([5, 5, 5, 4])
        elif r_type < 0.80: # genuine neutral
            t, rev = random.choice(genuine_neutral_templates)
            rating = random.choice([3, 4, 3])
        elif r_type < 0.90: # genuine negative
            t, rev = random.choice(genuine_negative_templates)
            rating = random.choice([1, 2, 1])
        else: # suspicious/heuristic test cases
            t, rev = random.choice(fake_templates)
            rating = 5
        
        reviews_data.append([
            laptop["fullName"],
            overall_rating,
            no_ratings,
            no_reviews,
            rating,
            t,
            rev
        ])

# Fill remaining up to exactly 600
while len(reviews_data) < total_target:
    laptop = random.choice(laptops_for_reviews)
    t, rev = random.choice(genuine_positive_templates)
    reviews_data.append([
        laptop["fullName"],
        round(laptop["rating_bias"], 1),
        500,
        250,
        5,
        t,
        rev
    ])

with open('data/raw/laptops_dataset_final_600.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['product_name', 'overall_rating', 'no_ratings', 'no_reviews', 'rating', 'title', 'review'])
    writer.writerows(reviews_data[:600])

print(f"Generated data/raw/laptops_dataset_final_600.csv with {len(reviews_data[:600])} reviews.")
