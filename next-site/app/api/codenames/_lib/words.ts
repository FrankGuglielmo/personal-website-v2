import type { PackId } from "@/app/codenames/_lib/types";

// Original, family-friendly word lists written for this site. Single words,
// at most 11 letters, so they stay legible on a 5x5 board cast to a TV.

const list = (s: string) => s.trim().split(/\s+/);

const CLASSIC = list(`
  Acorn Album Alley Ankle Antenna Apron Arcade Arrow Attic Avalanche Backpack Badge Bagel Bakery Balloon Bamboo
  Banana Bandage Banjo Barn Barrel Basket Beacon Beard Beaver Beehive Beetle Bench Bicycle Biscuit Blanket Blender
  Blizzard Blueprint Bonfire Bookmark Boomerang Bracelet Bubble Bucket Budget Bulldozer Bunny Burrow Butter Cabin
  Cactus Camel Camera Campfire Candle Cannon Canoe Canyon Caramel Carpet Cartoon Cashier Caterpillar Cathedral Cave
  Cello Cereal Chalk Champion Chandelier Cheese Cheetah Cherry Chess Chimney Chipmunk Cinema Circus Clam Clarinet
  Clock Cloud Clown Coach Coconut Coffee Coin Comet Compass Cookie Coral Costume Cottage Couch Cowboy Crayon Crib
  Crocodile Crumb Crystal Cupcake Curtain Cushion Daisy Dandelion Dart Desert Detective Diary Dimple Diner Dolphin
  Donkey Doorbell Dough Dragonfly Drum Dune Dust Easel Echo Elbow Elevator Envelope Eraser Escalator Fairy Falcon
  Feather Ferry Festival Fiddle Firefly Flag Flame Flashlight Flamingo Flipper Fog Fossil Fountain Freckle Fridge
  Frog Frost Funnel Galaxy Garage Garden Garlic Gecko Gift Giraffe Glacier Gladiator Globe Goat Goblin Goggles
  Gorilla Gravity Guitar Hairbrush Hammer Hammock Harbor Harmonica Harp Hedgehog Helmet Hiccup Hippo Hockey Hoodie
  Hula Hurricane Igloo Iguana Island Jacket Jaguar Jeans Jelly Jester Jigsaw Joystick Juggler Jungle Kayak Kettle
  Kite Kitten Koala Ladder Ladybug Lagoon Lamp Lantern Lasso Lava Lighthouse Lizard Llama Lobster Locker Lollipop
  Lullaby Magnet Mailbox Mango Marshmallow Mascot Mattress Maze Meadow Medal Melon Mermaid Meteor Microphone Mirror
  Mitten Monkey Moose Mop Mosquito Motorcycle Muffin Mummy Museum Mushroom Napkin Nest Noodle Oasis Ocean Orbit
  Orchestra Ostrich Otter Owl Oyster Paddle Paintbrush Pajamas Panda Parade Parrot Passport Peach Peacock Peanut
  Pebble Pelican Pencil Pepper Pickle Picnic Pillow Pineapple Planet Plum Pocket Pogo Pony Popcorn Postcard Potato
  Pretzel Puddle Puppet Puzzle Quicksand Quilt Raccoon Radio Raft Rainbow Raincoat Recipe Reindeer Rhino Ribbon
  Riddle Rocket Rodeo Hopscotch Saddle Sailboat Salad Sandal Sandcastle Sandwich Saxophone Scarecrow Scarf
  Scissors Seesaw Seashell Sheriff Shovel Skateboard Skeleton Sled Sloth Snail Sneaker Sneeze Soap Sofa Spoon Sponge
  Squirrel Stamp Statue Stethoscope Storm Submarine Suitcase Sunflower Sunglasses Sushi Swan Sweater Sword Taco Tent
  Thunder Ticket Tiger Toaster Toothbrush Tornado Tortoise Towel Tractor Trampoline Treasure Treehouse Trophy
  Trumpet Tulip Tunnel Turtle Tuxedo Umbrella Unicycle Vase Velvet Violin Volcano Waffle Wagon Wallet Walrus Wand
  Waterfall Wheelbarrow Whisker Whistle Wig Windmill Wizard Wolf Yacht Yawn Yogurt Zebra Zipper Zoo Laugh Whisper
  Dream Secret Shiver Wink Tickle Gossip Magic Vacation Weekend Birthday Recess Homework Selfie Podcast Emoji
  Password Charger Remote Keyboard Laptop Headphones Speaker Drone Hashtag Avocado Hourglass Pinata Mosaic
  Origami Pinwheel Snorkel Stopwatch Tambourine Trapeze Ukulele Vampire Werewolf Zombie Astronaut Cyclops
`);

const FOOD = list(`
  Bacon Baguette Brownie Burrito Cheddar Chili Cinnamon Cobbler Croissant Cucumber Doughnut Dumpling Eggplant
  Espresso Fajita Fondue Fries Fudge Ginger Granola Guacamole Gumbo Hotdog Hummus Jalapeno Kebab Lasagna Lemonade
  Licorice Macaroni Mayo Meatball Milkshake Mustard Nacho Nutmeg Oatmeal Omelet Pancake Paprika Pasta Pesto Pizza
  Pudding Quesadilla Radish Ramen Raisin Ravioli Salsa Sausage Smoothie Soup Spaghetti Sprinkles Steak Stew Sundae
  Syrup Tamale Toffee Tofu Tortilla Truffle Vanilla Wasabi Watermelon Zucchini Brisket Cupcake Waffle Bagel Pretzel
  Popcorn Pickle Avocado Coconut Mango Peach Cherry Plum Garlic Pepper Cereal Cookie Butter Yogurt Sushi Taco Muffin
  Noodle Marshmallow Caramel Biscuit Salad Sandwich Potato Peanut Burger Lollipop Popsicle Pistachio
`);

const PLACES = list(`
  Airport Aquarium Backyard Ballroom Basement Bayou Boardwalk Bookstore Bowling Cafeteria Campsite Carnival Cellar
  Classroom Courthouse Dentist Dock Dungeon Farm Gym Highway Kitchen Laundromat Library Mall Mansion Marina Market
  Motel Mountain Observatory Office Orchard Palace Pharmacy Pier Planetarium Playground Quarry Rainforest Ranch Reef
  Rink Salon Savanna Skatepark Stage Subway Suburb Swamp Tundra Valley Vineyard Warehouse Paris Venice Hawaii Texas
  Alaska Vegas Sahara Tahiti Iceland Brazil Japan Peru Kenya Nepal Norway Sydney Dublin Cairo Seoul Toronto Cabin
  Castle Canyon Desert Diner Garage Harbor Igloo Island Jungle Lagoon Lighthouse Meadow Museum Oasis Treehouse Attic
  Arcade Bakery Barn Cinema Cottage Circus Zoo Volcano Glacier
`);

const HOLIDAY = list(`
  Drumstick Gravy Stuffing Cranberry Pilgrim Harvest Cornucopia Parade Football Leftovers Casserole Wishbone Acorn
  Scarecrow Hayride Sweater Mitten Fireplace Cocoa Sleigh Ornament Wreath Mistletoe Snowflake Icicle Gingerbread
  Eggnog Peppermint Stocking Chimney Present Reindeer Elf Lantern Menorah Dreidel Latke Fireworks Confetti Countdown
  Midnight Resolution Hibernate Snowball Sled Earmuffs Blanket Pecan Yam Cider Squash Cornbread Feast Gratitude
  Napkin Gobble Oven Apron Roast Recipe Grandma Cousin Charades Trivia Thermos Cabin Quilt Bonfire Pinecone Marshmallow
  Pajamas Nap Candle Toast
`);

const PACKS: Record<Exclude<PackId, "mix">, readonly string[]> = {
  classic: CLASSIC,
  food: FOOD,
  places: PLACES,
  holiday: HOLIDAY,
};
const MIX = [...new Set(Object.values(PACKS).flat())];

export function wordsFor(pack: PackId): readonly string[] {
  return pack === "mix" ? MIX : PACKS[pack];
}
