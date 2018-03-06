// Evolutionary "Steering Behavior" Simulation

// An array of vehicles
var population = [];

// An array of "food"
var food = [];
// An array of "poison"
var poison = [];

// How good is food, how bad is poison?
var nutrition = [0.1, -1];

// Show additional info on DNA?
var debug;

function setup() {
	
  // Add canvas and grab checkbox
  var canvas = createCanvas(1000, 1000);
  //canvas.parent('canvascontainer');
  //debug = select('#debug');

  // Create 10 vehicles
  angleMode(RADIANS);
  for (var i = 0; i < 10; i++) {
    population[i] = new Vehicle(width / 2, height / 2);
  }
  // Start with some food
  for (var k = 0; k < 10; k++) {
    food[k] = createVector(random(width), random(height));
  }
  // Start with some poison
  for (var l = 0; l < 5; l++) {
    poison[l] = createVector(random(width), random(height));
  }
}

// Add new vehicles by dragging mouse
function mouseDragged() {
  population.push(new Vehicle(mouseX, mouseY));
}

function draw() {
  background(0);

  // 25% chance of new food
  if (random(1) < 0.25) {
    food.push(createVector(random(width), random(height)));
  }

  // 1% chance of new poison
  if (random(1) < 0.01) {
    poison.push(createVector(random(width), random(height)));
  }

  // Go through all vehicles
  for (var i = population.length - 1; i >= 0; i--) {
    var v = population[i];

    // Eat the food (index 0)
    v.eat(food, 0);
    // Eat the poison (index 1)
    v.eat(poison, 1);
    // Check boundaries
    v.boundaries();

    // Update and draw
    v.update();
    v.display();

    // If the vehicle has died, remove
    if (v.dead()) {
      population.splice(i, 1);
    } else {
      // Every vehicle has a chance of cloning itself
      var child = v.birth();
      if (child != null) {
        population.push(child);
      }
    }
  }

  // Draw all the food and all the poison
  for (var a = 0; a < food.length; a++) {
    fill(0, 255, 0);
    noStroke();
    ellipse(food[a].x, food[a].y, 4);
  }

  for (var j = 0; j < poison.length; j++) {
    fill(255, 0, 0);
    noStroke();
    ellipse(poison[j].x, poison[j].y, 4);
  }
}

function Vehicle(x, y, dna) {

  // All the physics stuff
  this.acceleration = createVector();
  this.velocity = p5.Vector.random2D();
  this.position = createVector(x, y);
  this.r = 3;
  this.maxforce = 0.5;
  this.maxspeed = 3;
  this.velocity.setMag(this.maxspeed);


  // Did it receive DNA to copy?
  if (dna instanceof Array) {
    this.dna = [];
    // Copy all the DNA
    for (var i = 0; i < dna.length; i++) {
      // 10% chance of mutation
      if (random(1) < 0.1) {
        if (i < 2) {
          // Adjust steering force weights
          this.dna[i] = dna[i] + random(-0.2, 0.2);

        } else {
          // Adjust perception radius
          this.dna[i] = dna[i] + random(-10, 10);
        }
        // Copy DNA
      } else {
        this.dna[i] = dna[i];
      }
    }
  } else {
    var maxf = 3;
    // DNA
    // 0: Attraction/Repulsion to food
    // 1: Attraction/Repulsion to poison
    // 2: Radius to sense food
    // 3: Radius to sense poison
    this.dna = [random(-maxf, maxf), random(-maxf, maxf), random(5, 100), random(5, 100)];
  }

  // Health
  this.health = 1;
}


// Method to update location
Vehicle.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset acceleration to 0 each cycle
  this.acceleration.mult(0);

  // Slowly die unless you eat
  this.health -= 0.002;

};

// Return true if health is less than zero
Vehicle.prototype.dead = function() {
  return (this.health < 0);
}

// Small chance of returning a new child vehicle
Vehicle.prototype.birth = function() {
  var r = random(1);
  if (r < 0.001) {
    // Same location, same DNA
    return new Vehicle(this.position.x, this.position.y, this.dna);
  }
}

// Check against array of food or poison
// index = 0 for food, index = 1 for poison
Vehicle.prototype.eat = function(list, index) {

  // What's the closest?
  var closest = null;
  var closestD = Infinity;
  // Look at everything
  for (var i = list.length - 1; i >= 0; i--) {
    // Calculate distance
    var d = p5.Vector.dist(list[i], this.position);

    // If it's within perception radius and closer than pervious
    if (d < this.dna[2 + index] && d < closestD) {
      closestD = d;
      // Save it
      closest = list[i];

      // If we're withing 5 pixels, eat it!
      if (d < 5) {
        list.splice(i, 1);
        // Add or subtract from health based on kind of food
        this.health += nutrition[index];
      }
    }
  }

  // If something was close
  if (closest) {
    // Seek
    var seek = this.seek(closest, index);
    // Weight according to DNA
    seek.mult(this.dna[index]);
    // Limit
    seek.limit(this.maxforce);
    this.applyForce(seek);
  }
}

// Add force to acceleration
Vehicle.prototype.applyForce = function(force) {
  this.acceleration.add(force);
}

// A method that calculates a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Vehicle.prototype.seek = function(target, index) {

  var desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
  var d = desired.mag();

  // Scale to maximum speed
  desired.setMag(this.maxspeed);

  // Steering = Desired minus velocity
  var steer = p5.Vector.sub(desired, this.velocity);

  // Not limiting here
  // steer.limit(this.maxforce);

  return steer;
}


Vehicle.prototype.display = function() {

  // Color based on health
  var green = color(0, 255, 0);
  var red = color(255, 0, 0);
  var col = lerpColor(red, green, this.health)

  // Draw a triangle rotated in the direction of velocity
  var theta = this.velocity.heading() + PI / 2;
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);

	// Extra info
  noFill();

  // Circle and line for food
  stroke(0, 255, 0, 100);
  ellipse(0, 0, this.dna[2] * 2);
  line(0, 0, 0, -this.dna[0] * 25);

  // Circle and line for poison
  stroke(255, 0, 0, 100);
  ellipse(0, 0, this.dna[3] * 2);
  line(0, 0, 0, -this.dna[1] * 25);


  // Draw the vehicle itself
  fill(col);
  stroke(col);
  beginShape();
  vertex(0, -this.r * 2);
  vertex(-this.r, this.r * 2);
  vertex(this.r, this.r * 2);
  endShape(CLOSE);
  pop();
}

// A force to keep it on screen
Vehicle.prototype.boundaries = function() {
  var d = 10;
  var desired = null;
  if (this.position.x < d) {
    desired = createVector(this.maxspeed, this.velocity.y);
  } else if (this.position.x > width - d) {
    desired = createVector(-this.maxspeed, this.velocity.y);
  }

  if (this.position.y < d) {
    desired = createVector(this.velocity.x, this.maxspeed);
  } else if (this.position.y > height - d) {
    desired = createVector(this.velocity.x, -this.maxspeed);
  }

  if (desired !== null) {
    desired.setMag(this.maxspeed);
    var steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    this.applyForce(steer);
  }
}