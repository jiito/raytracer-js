function Sphere(params) { // Hitable 
  // represents a sphere object
  this.center = params['center']; // center of the sphere (vec3)
  this.radius = params['radius']; // radius of sphere (float)
  this.material = params['material']; // material used to shade the sphere (see 'Material' below)
  this.name = params['name'] || 'sphere'; // a name to identify the sphere (useful for debugging) (string)
  this.color = params['color'];
}


/**
 * Calculate if a ray hits the sphere object. 
 * @returns Intersection or undefined
 */

Sphere.prototype.hit = function (ray, tmin, tmax) {
  // console.log("Sphere hit")
  // console.log(ray, tmin, tmax)
  let A = vec3.dot(ray.direction, ray.direction)
  let B = vec3.dot(ray.direction, vec3.sub(vec3.create(), ray.x0, this.center))
  let C = vec3.sqrDist(ray.x0, this.center) - Math.pow(this.radius, 2)

  let desc = Math.pow(B, 2) - C

  if (desc < 0.0) return undefined

  // console.log("yes desc")

  let t1 = - B - Math.sqrt(desc)
  let t2 = - B + Math.sqrt(desc)

  let t = Math.min(t1, t2)

  if (t < tmin || t > tmax) return undefined
  // console.log("yest t")

  //  compute surface normal 
  let int_p = vec3.create()
  let s_normal = vec3.create()
  vec3.add(int_p, ray.x0, vec3.scale(vec3.create(), ray.direction, t))
  vec3.normalize(s_normal, vec3.sub(vec3.create(), int_p, this.center))
  // console.log(s_normal)

  return new Intersection(t, this, int_p, s_normal)
}

/**
 * Calculate the bounding box of a Sphere object
 * @returns AABB - the bounding box
 */
Sphere.prototype.boundingBox = function () {
 let min = vec3.create() 
 let max = vec3.create() 

 vec3.sub(min, this.center, vec3.fromValues(this.radius, this.radius, this.radius))
 vec3.add(min, this.center, vec3.fromValues(this.radius, this.radius, this.radius))
 this.box = new AABB(min, max) 
 
 return this.box
}