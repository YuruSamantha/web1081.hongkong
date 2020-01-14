"use strict";
document.body.style.margin = "0px";
document.body.style.backgroundColor = "#000";

var canvas = document.getElementById("canvas");
canvas.style.background = "rgb(157,54,63)";
canvas.width = window.innerWidth || document.body.clientWidth;
canvas.height = 500;
var ctx = canvas.getContext("2d");


function init(){
  // Set the function to run each frame and FPS
  createjs.Ticker.addEventListener("tick", tick);
  createjs.Ticker.setFPS(60);
  createjs.Ticker.useRAF = false;
}


// Draw to buffer
var buffer = document.createElement('canvas');
buffer.width = canvas.width;
buffer.height = canvas.height;
buffer.style.visibility='hidden';
var bufferCtx = buffer.getContext('2d');


// Box2D scaling (affects max velocity of particles)
var SCALE = 30;
var Vec = Box2D.Common.Math.b2Vec2;
var stage = new createjs.Stage("canvas");
var world = new Box2D.Dynamics.b2World(
  new Vec(0, 15) // Gravity vector in physics world
);



// Array for Raindrop objects
var rain = [];
var MAX_DROPS = 800;
// Class: Raindrop
function Raindrop() {
    // Set the CreateJS update method
    // Add Box2D physics body
  this.body = (function(){
    var bodyDef = new Box2D.Dynamics.b2BodyDef();
    bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
    bodyDef.position.Set( Math.random()*canvas.width*1.1 / SCALE, 0); // World coordinates
    var body = world.CreateBody(bodyDef);
        
    body.CreateFixture(Raindrop.prototype.fixDef);
    
    return body;
  }());
}; // Raindrop class
Raindrop.prototype.onTick = function() {    
  // Slow horizontal velocity to create dripping effect
  var v = this.body.GetLinearVelocity();
  if (v.y < 300/SCALE || v.x > 0){
    this.body.SetLinearVelocity(new Vec(v.x*0.9,v.y));
  }
  // UPDATE IMAGE POSITION TO MATCH BOX2D BODY
  this.x = this.body.GetPosition().x * SCALE;
  this.y = this.body.GetPosition().y * SCALE;
  return this.y;
}
Raindrop.prototype.fixDef = (function() {
  var fixDef = new Box2D.Dynamics.b2FixtureDef();
  fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(1/SCALE);
  fixDef.shape.SetLocalPosition(new Vec(0, 0));
  fixDef.density = 0.1;
  fixDef.friction = 0.0;
  fixDef.restitution = 0.0;
  fixDef.filter.categoryBits = 0x0001;
  fixDef.filter.maskBits = 0x0002;
  return fixDef;
}());



// Class: Boy
function Boy() {
  // Createjs Shape
  var view = new createjs.Bitmap("https://drive.google.com/uc?export=view&id=1K-0q2BCG6OQw94rNEocXOyF3Y9rmlXu_");
  view.set({
    // Set the "center" of this object
    regX : 0 / 2,
    regY : 0 / 2,
    // Set the CreateJS update method
    onTick : function() {
      // Move boy after walking off screen
      var v = this.body.GetPosition();
      if (v.x < -300/SCALE){
        this.body.SetPosition(new Vec(canvas.width/SCALE, v.y)); 
      }
      // UPDATE IMAGE POSITION AND ROTATION TO MATCH BOX2D BODY
      this.x = this.body.GetPosition().x * SCALE;
      this.y = this.body.GetPosition().y * SCALE;
    },
    // Add Box2D physics body
    body : (function(){
      var bodyDef = new Box2D.Dynamics.b2BodyDef();
      bodyDef.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
      bodyDef.fixedRotation = true; // Prevent any rotation
      bodyDef.position.Set( canvas.width/2/SCALE, 240/SCALE); // World coordinates
      var body = world.CreateBody(bodyDef);
          
      var fixDef = new Box2D.Dynamics.b2FixtureDef();
      fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
      var vertices = [
          new Vec(88/SCALE, 36/SCALE),
          new Vec(114/SCALE, 35/SCALE),
          new Vec(140/SCALE, 38/SCALE),
          new Vec(160/SCALE, 44/SCALE),
          new Vec(183/SCALE, 56/SCALE),
          new Vec(202/SCALE, 70/SCALE),
          new Vec(213/SCALE, 81/SCALE),
          new Vec(229/SCALE, 103/SCALE),
          new Vec(238/SCALE, 123/SCALE),
          new Vec(246/SCALE, 148/SCALE),
          new Vec(252/SCALE, 170/SCALE),
          new Vec(253/SCALE, 191/SCALE),
      ];
      fixDef.shape.SetAsArray(vertices, 12);
      
      fixDef.density = 1.0;
      fixDef.friction = 0.3; 
      fixDef.restitution = 0.0;
      fixDef.filter.categoryBits = 0x0002;
      fixDef.filter.maskBits = 0x0001;
      body.CreateFixture(fixDef);
      
      return body;
    }())
  });
  
  return view;
}; // Boy class



var boy = new Boy();
stage.addChild(boy);
var yOffset = 0;


function tick(){
  // BOX2D WORLD: PHYSICS STEP FORWARD THEN CLEAR FORCES
  world.Step(
    1 / 60   //frame-rate
    ,  4       //velocity iterations
    ,  4       //position iterations
  );
  world.ClearForces();
  
  var v = boy.body.GetPosition();
  boy.body.SetPosition(new Vec(v.x-1/120,v.y+Math.cos(yOffset)/200));
  yOffset += 0.06;
   
          
  // Add rain drops
  for (var i = 0; i < 16 && rain.length < MAX_DROPS; i++) {
    var drop = new Raindrop();
    var r = Math.random();
    drop.body.SetLinearVelocity(new Vec(-100/SCALE-r*2,400/SCALE-r));
    //stage.addChild(drop); 
    rain.push(drop);
  }
          
  // Remove rain drops
  for (var i = rain.length-1; i >= 0; i--){
    if (rain[i].y > canvas.height){
      //wait
      rain[i].body.SetLinearVelocity(new Vec(-100/SCALE,400/SCALE));
      rain[i].body.SetPosition(new Vec(Math.random()*canvas.width*1.1 / SCALE, 0));
      
    }
  }
              
  bufferCtx.strokeStyle = '#f2dddc';
  for (var i = 0; i < rain.length; i++){
    var r = rain[i];
    bufferCtx.beginPath();
    bufferCtx.moveTo(~~r.x, ~~r.y);
    //r.onTick(); // Update position
    if (r.y < r.onTick()){
      bufferCtx.lineTo(~~r.x, ~~r.y);
      bufferCtx.stroke();
    }
  }
  
  stage.update();  
  ctx.drawImage(buffer, 0, 0);
  bufferCtx.clearRect(0, 0, canvas.width, canvas.height);
}

// Run the animation
init();

$('#voice').append('<embed id="embed_player" src="https://drive.google.com/uc?export=view&id=1f0XgdIdZWw3zNQv6Xcwp1uinyXrUMzk0" autostart="true" hidden="true"></embed>');

<script
  src="https://code.jquery.com/jquery-3.4.1.slim.js"
  integrity="sha256-BTlTdQO9/fascB1drekrDVkaKd9PkwBymMlHOiG+qLI="
  crossorigin="anonymous"></script>