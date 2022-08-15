function RayTracer(canvasID) {
  /**
   * Initializes an instance of the RayTracer class.
   * You may also wish to set up your camera here.
   * (feel free to modify input parameters to set up camera).
   * 
   * @param canvasID (string) - id of the canvas in the DOM where we want to render our image
   */
  // setup the canvas
  this.canvas = document.getElementById(canvasID);


  // set BVH 
  this.doBVH = false

  // setup the background style: current options are 'daylight' or 'white'
  this.sky = 'daylight';

  // initialize the objects and lights
  this.objects = new Array();
  this.lights = new Array();
  this.spp = parseInt(document.getElementById('spp').value) || 1


  // CREATE THE CAMERA 
  // params 
  let camParams = {
    eye: vec3.fromValues(0, 2, 10),
    center: vec3.fromValues(
      -0.07164544612169266,
      0.15180052816867828,
      0.212920486927032477),
    up: vec3.fromValues(0.0, 1.0, 0.0),
    fov: 0.7853981633974483,
    a: this.canvas.width / this.canvas.height
  }

  this.camera = new Camera(camParams)
}

RayTracer.prototype.draw = function () {
  /**
   * Renders the scene to the canvas.
   * Loops through all pixels and computes a pixel sample at each pixel midpoint.
   * Pixel color should then be computed and assigned to the image.
  **/
  // get the canvas and the image data we will write to
  let context = this.canvas.getContext('2d');
  let image = context.createImageData(this.canvas.width, this.canvas.height);

  // numbers of pixels in x- and y- directions
  const nx = image.width;
  const ny = image.height;

  
  // this.rootBVHNode = new BVHNode(this.objects, 0, this.objects.length - 1)

  // loop through the canvas pixels
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      // compute pixel color
      let color = vec3.create();

      //sample per pixel
      for (let s = 0; s < this.spp; s++) {

        // compute pixel coordinates in [0,1] x [0,1]
        let px = (i + Math.random()) / nx;      // sample at pixel center
        let py = (ny - j - Math.random()) / ny; // canvas has y pointing down, but image plane has y going up


        // YOU NEED TO DETERMINE PIXEL COLOR HERE (see notes)
        // i.e. cast a ray through (px,py) and call some 'color' function
        let ray = this.genRay(px, py)

        vec3.add(color, color, this.color(ray, 10))
      }
      //average color 
      vec3.scale(color, color, 1 / this.spp)
      // set the pixel color into our final image
      this.setPixel(image, i, j, color[0], color[1], color[2]);
    }
  }
  context.putImageData(image, 0, 0);
}

/**
 * Fucntion to traverse the bvh nodes and return the smallest intersetction 
 * 
 */
// RayTracer.prototype.bvhTraverse = function (root, ray) {

// }

RayTracer.prototype.background = function (ray) {
  /**
   * Computes the background color for a ray that goes off into the distance.
   * 
   * @param ray - ray with a 'direction' (vec3) and 'point' (vec3)
   * @returns a color as a vec3 with (r,g,b) values within [0,1]
   * 
   * Note: this assumes a Ray class that has member variable ray.direction.
   * If you change the name of this member variable, then change the ray.direction[1] accordingly.
  **/
  if (this.sky === 'white') {
    // a white sky
    return vec3.fromValues(1, 1, 1);
  }
  else if (this.sky === 'daylight') {
    // a light blue sky :)
    let t = 0.5 * ray.direction[1] + 0.2; // uses the y-values of ray.direction
    if (ray.direction == undefined) t = 0.2; // remove this if you have a different name for ray.direction
    let color = vec3.create();
    vec3.lerp(color, vec3.fromValues(.5, .7, 1.), vec3.fromValues(1, 1, 1), t);
    return color;
  }
  else
    alert('unknown sky ', this.sky);
}

RayTracer.prototype.setPixel = function (image, x, y, r, g, b) {
  /**
   * Sets the pixel color into the image data that is ultimately shown on the canvas.
   * 
   * @param image - image data to write to
   * @param x,y - pixel coordinates within [0,0] x [canvas.width,canvas.height]
   * @param r,g,b - color to assign to pixel, each channel is within [0,1]
   * @returns none
   * 
   * You do not need to change this function.
  **/
  let offset = (image.width * y + x) * 4;
  image.data[offset] = 255 * Math.min(r, 1.0);
  image.data[offset + 1] = 255 * Math.min(g, 1.0);
  image.data[offset + 2] = 255 * Math.min(b, 1.0);
  image.data[offset + 3] = 255; // alpha: transparent [0-255] opaque
}
RayTracer.prototype.color = function (ray, depth) {

  if (depth === 0) {
    // reached max depth 
    return this.background(ray)
  }

  // collide ray 
  let hit = this.hit(ray)

  if (!hit) return this.background(ray)

  
  let color = vec3.create();

  if (hit.hit_obj.material){

    vec3.mul(color, hit.hit_obj.material.ka, vec3.fromValues(1.0, 1.0, 1.0))

    //iterate over lights
    for (const light of this.lights) {
      // calculate the light direction to create ray from 
      let light_dir = vec3.create()

      vec3.sub(light_dir, light.location, hit.point)

      let shadow_ray = new Ray(light_dir, hit.point)

      let blocked_hit = this.hit(shadow_ray)
      
      if (!blocked_hit) {
        vec3.add(color, color, hit.hit_obj.material.shade(ray, light, hit))
      }
    }

    // SCATTER

    let scatter_ray = hit.hit_obj.material.scatter(ray, hit)

    if (scatter_ray) {
      let scatter_color = this.color(scatter_ray, depth - 1)
      // mix colors
      vec3.scaleAndAdd(color, vec3.scale(vec3.create(), color, 0.5), scatter_color, 0.5)
    }
  } else {
    color = hit.hit_obj.color
  }

  return color

}
let x = 0;

RayTracer.prototype.hit = function (ray) {
  // OVER OBJECTS

  if (this.doBVH){
    let rootHit = this.rootBVHNode.hit(ray, .001, 1e20)
    if (x < 3){

      console.log(totalHits)
      console.log(totalTrianglesHit)
      x++
    }
    totalHits = 0;
    bothDefined = 0;
    totalTrianglesHit = 0;
    return rootHit
  } else {
    let minIntersection;
    for (const obj of this.objects) {
      let intersection = obj.hit(ray, .001, 1e20)
      if (intersection) {
        if (!minIntersection || intersection.param_t < minIntersection.param_t ) {
          minIntersection = intersection
        }
      }
    }
    return minIntersection
  }
}



function Light(params) {
  // describes a point light source, storing the location of the light
  // as well as ambient, diffuse and specular components of the light
  this.location = params.location; // location of the light
  this.color = params.color || vec3.fromValues(1, 1, 1); // default to white (vec3)
  this.ld = vec3.create()
  vec3.scale(this.ld, this.color, 0.75)
  this.ls = vec3.create()
  vec3.scale(this.ls, this.color, 0.75)
  this.la = this.color
  // you might also want to save some La, Ld, Ls and/or compute these from 'this.color'
}


RayTracer.prototype.genRay = function (px, py) {
  this.pu = (-this.camera.wid / 2.0) + (px * this.camera.wid)
  this.pv = (-this.camera.h / 2.0) + (py * this.camera.h)
  this.pw = - this.camera.d

  this.q = vec3.fromValues(this.pu, this.pv, this.pw)

  this.p = vec3.create()
  vec3.transformMat3(this.p, this.q, this.camera.orthoBasis)


  return new Ray(this.p, this.camera.eye)
}

function Ray(direction, origin) {

  this.x0 = origin.slice()

  this.direction = vec3.create()
  vec3.normalize(this.direction, direction)
}

