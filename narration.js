// Narration script for the video, one entry per sentence.
// A sentence is either "caption text" or ["caption text", "how the voice should say it"].
// After editing, re-record the audio with:
//   ~/.cache/drone-website-tts/venv/bin/python tools/make_narration.py
window.NARRATION = {
  "intro": [
    "Have you ever wondered how a drone can hang perfectly still in the air, then zip off in any direction?",
    "In the next few minutes, you'll learn what a drone is, what's inside one, and exactly how its spinning propellers keep it flying."
  ],
  "what": [
    "A drone is simply an aircraft with no pilot sitting inside it.",
    "Instead, a person flies it from the ground with a remote control, or a computer flies it by following a route that was planned ahead of time.",
    ["That's why engineers call it a UAV, which stands for Unmanned Aerial Vehicle.", "That's why engineers call it a U.A.V, which stands for Unmanned Aerial Vehicle."],
    "Unmanned just means there's nobody on board."
  ],
  "types": [
    "Drones come in a few main shapes, and each one is good at different jobs.",
    "Multirotors, like the four-propeller quadcopter, can take off straight up and hover in one spot. They're the most common kind, and the one we'll focus on.",
    "Fixed-wing drones look like small airplanes. Their wings do the lifting, so they can fly much farther, but they can't hover.",
    "Single-rotor drones are like mini helicopters, with one big rotor on top and a small one on the tail.",
    "And hybrid VTOL drones (short for vertical take-off and landing) rise straight up like a quadcopter, then fly forward on wings like a plane."
  ],
  "uses": [
    "Because drones can reach places that are hard, slow, or dangerous for people to get to, they're used for all kinds of jobs:",
    "filming movies and sports, delivering packages, checking the health of crops, searching for missing people, mapping land, inspecting bridges, studying storms, and even racing."
  ],
  "parts": [
    "Now let's open up a quadcopter and see what's inside.",
    "The frame is the skeleton. It's light but stiff, and it holds every other part in place.",
    "At the end of each arm is an electric motor. These motors can spin thousands of times a minute and change speed in a split second.",
    "Each motor turns a propeller. The propellers are what actually push the drone into the air.",
    ["Every motor has its own electronic speed controller, or ESC, which decides exactly how much power that motor gets.", "Every motor has its own electronic speed controller, or E S C, which decides exactly how much power that motor gets."],
    "In the middle sits the flight controller: a tiny computer that acts as the drone's brain.",
    "The battery stores the energy for everything. Most drones can fly for about twenty to forty minutes on one charge.",
    "A GPS receiver listens to satellites, so the drone always knows where it is.",
    "And the camera, often mounted on a steadying gimbal, captures the view."
  ],
  "chain": [
    "So how do all these parts work together? Let's follow one command from start to finish.",
    "When you push a stick on the controller, it turns your movement into a radio signal and sends it to the drone.",
    "A receiver on the drone catches that signal.",
    "The flight controller reads your command, compares it with what the drone is doing right now, and works out how fast each motor should spin.",
    ["It sends those orders to the ESCs, which feed each motor exactly the right amount of power.", "It sends those orders to the E S C's, which feed each motor exactly the right amount of power."],
    "The motors speed up or slow down, changing how fast each propeller turns.",
    "And the propellers push the air, which moves the drone. All of this happens in a tiny fraction of a second."
  ],
  "sensors": [
    "Here's something surprising: a quadcopter can't balance on its own. Keeping it level is like balancing a broom on your hand. It needs constant tiny corrections.",
    "So the flight controller is always checking its sensors.",
    "A gyroscope senses the smallest tip or twist.",
    "An accelerometer feels which way is down, and how quickly the drone is speeding up.",
    "A barometer measures air pressure, which tells the drone how high it is.",
    "GPS finds its exact position on Earth.",
    "And a compass tells it which way it's facing.",
    "The flight controller reads these sensors and corrects the motors hundreds of times every second. That's why a good drone can hold steady, even in a gusty wind."
  ],
  "thrust": [
    "To understand flying, you only need to know about two forces.",
    "The first is weight. Gravity is always pulling the drone down toward the ground.",
    "The second is thrust. That's the upward push made by the propellers.",
    "When thrust exactly equals weight, the forces balance, and the drone hovers in place.",
    "Make more thrust than weight, and the drone climbs.",
    "Make less thrust than weight, and gravity wins, so the drone gently descends."
  ],
  "props": [
    "So where does thrust come from? It all comes down to the propellers.",
    "A spinning propeller grabs the air around it and throws it downward, hard.",
    "Isaac Newton's third law says that every action has an equal and opposite reaction.",
    "So when the propellers push air down, the air pushes the propellers, and the whole drone, up.",
    "It's the same idea as a balloon zooming forward when you let the air rush out of the back.",
    "You can even feel this downward wind, called downwash, if you stand near a flying drone."
  ],
  "airfoil": [
    "Let's zoom in on a single propeller blade. If you sliced through it, you'd see it's shaped just like an airplane wing.",
    "The blade is tilted slightly, so as it sweeps through the air, it scoops the air and pushes it downward.",
    "Its curved top also makes the air flowing over it speed up, which lowers the air pressure above the blade.",
    "The air below has higher pressure, so the blade gets pushed upward. That upward push is called lift.",
    "Try holding your flat hand out of a car window and tilting it up a little. You'll feel the very same force.",
    "And the faster a propeller spins, the more lift it makes. Spin it twice as fast, and you get about four times the thrust."
  ],
  "pitch": [
    "Not all propellers are the same. They come in different sizes and shapes.",
    ["A propeller labelled 5×4.5 is 5 inches across. That's its diameter.", "A propeller labelled five by four point five is five inches across. That's its diameter."],
    ["The second number, 4.5, is its pitch: how far it would move forward in one full turn if it twisted through the air like a screw into wood.", "The second number, four point five, is its pitch: how far it would move forward in one full turn, if it twisted through the air like a screw into wood."],
    "Bigger propellers, more pitch, or more blades all grab more air, which means more thrust.",
    "But there's a trade-off: the motors have to work harder, and the battery drains faster."
  ],
  "torque": [
    "There's one more clever trick hidden in a drone's design.",
    "As each motor spins its propeller, the air pushes back against the blades, and that tries to twist the whole drone the opposite way. This twisting force is called torque.",
    "If all four propellers spun in the same direction, those twists would add up, and the drone would spin around like a top!",
    "So drones use two propellers that spin clockwise and two that spin counter-clockwise, placed diagonally from each other.",
    "Their twists cancel each other out, and the drone stays pointing straight."
  ],
  "steering": [
    "A quadcopter has no wings to steer with, and no rudder. Everything it does comes from changing the speed of its four propellers.",
    "To go up, all four propellers speed up together.",
    "To fly forward, the back two spin a little faster. That tips the nose down, so some of the thrust now points backward and pushes the drone forward.",
    "To slide right, the left side spins faster, so the drone leans to the right and moves that way.",
    "And to turn, the clockwise pair and the counter-clockwise pair spin at different speeds. The twists no longer cancel, so the drone rotates on the spot.",
    "The good news? You never have to do this math yourself. You just move the sticks, and the flight controller works out all four speeds for you."
  ],
  "wrap": [
    "And that's how drones fly!",
    "A tiny computer, fast motors, and spinning wing-shaped propellers, all working together hundreds of times a second to keep the drone balanced and moving.",
    "Now scroll down to explore each part up close, try flying the drone yourself, and test what you've learned in the quiz."
  ]
};
