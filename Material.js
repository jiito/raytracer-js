function Material(params) {
  if (!params) return undefined
  // represents a generic material class
  this.type = params.type; // diffuse, reflective, refractive (string)
  this.shine = params.shine; // phong exponent (float)
  this.color = params.color || vec3.fromValues(0.5, 0.5, 0.5); // default to gray color (vec3)
  // you might also want to save some ka, kd, ks and/or compute these from 'this.color'
  this.ka = vec3.create()
  vec3.scale(this.ka, this.color, 0.4)
  this.kd = this.color
  this.ks = vec3.fromValues(1.0, 1.0, 1.0)
  this.eta = params.eta || 1.0
}

Material.prototype.scatter = function (ray, hitInfo) {
  if (hitInfo.hit_obj.material.type === "reflective") {
    // reflect
    return this.reflect(ray, hitInfo)
  } else if (hitInfo.hit_obj.material.type === "refractive") {
    // refract 
    return this.refract(ray, hitInfo)
  } else {
    return undefined
  }
}

Material.prototype.shade = function (ray, light, hitInfo) {
  // constants
  const kd = hitInfo.hit_obj.material.kd
  const ks = hitInfo.hit_obj.material.ks
  const s = hitInfo.hit_obj.material.shine
  let l = vec3.create()
  vec3.normalize(l, vec3.sub(vec3.create(), light.location, hitInfo.point))
  let v = vec3.create()
  vec3.normalize(v, vec3.negate(vec3.create(), ray.direction))
  let h = vec3.create()
  vec3.normalize(h, vec3.add(vec3.create(), v, l))
  const n = hitInfo.normal.slice()
  let diffuse = vec3.create()
  let specular = s ? vec3.create() : vec3.fromValues(0, 0, 0)

  // diffuse 
  vec3.scale(diffuse, vec3.mul(vec3.create(), kd, light.ld), Math.max(0, vec3.dot(n, l)))

  // specular 
  if (s) vec3.scale(specular, vec3.mul(vec3.create(), ks, light.ls), Math.max(0, Math.pow(Math.abs(vec3.dot(n, h)), s)))

  let res = vec3.create()
  vec3.add(res, diffuse, specular)

  return res
}

// function to return array 
Material.prototype.reflect = function (ray, hitInfo) {
  let v = ray.direction.slice()
  let n = hitInfo.normal.slice()


  const r = vec3.create();
  vec3.scale(r, n, -2.0 * vec3.dot(v, n));
  vec3.add(r, r, v);

  return new Ray(r, hitInfo.point)
}

Material.prototype.refract = function (ray, hitInfo) {
  let v = ray.direction.slice()
  let n = hitInfo.normal.slice()


  // check if we are entering or exiting 


  let n1_over_n2;
  // from lecture 11
  let dt = vec3.dot(v, n);
  if (dt > 0.0){
    vec3.scale(n, n, -1.0)
    n1_over_n2 = this.eta
  } else {
    n1_over_n2 = 1.0 / this.eta
  }
  dt = vec3.dot(v, n);

  let discriminant = 1.0 - n1_over_n2 * n1_over_n2 * (1.0 - dt * dt);
  if (discriminant < 0.0) {
    // total internal reflection
    return this.reflect(ray, hitInfo);
  }

  let r1 = vec3.create();
  vec3.scaleAndAdd(r1, v, n, -dt);
  vec3.scale(r1, r1, n1_over_n2);

  let r2 = vec3.create();
  vec3.scale(r2, n, Math.sqrt(discriminant));

  let r = vec3.create();
  vec3.subtract(r, r1, r2);

  return new Ray(r, hitInfo.point)

}