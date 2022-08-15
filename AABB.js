function AABB(min, max){
  this.min = min || vec3.create() //vec3
  this.max = max || vec3.create() // vec3
}

AABB.prototype.hit = function(ray, tmin, tmax){
  // iterate over dimensions 
  for (let d = 0; d < 3; d++){
    let t0 = Math.min(
        (this.min[d] - ray.x0[d] / ray.direction[d]),
        (this.max[d] - ray.x0[d] / ray.direction[d]))
    let t1 = Math.max(
        (this.min[d] - ray.x0[d] / ray.direction[d]),
        (this.max[d] - ray.x0[d] / ray.direction[d]))

    let t_min = Math.min(t0, tmin)
    let t_max = Math.max(t1, tmax)
    if (t_max <= t_min){
      return undefined
    }
  }
  return true
}