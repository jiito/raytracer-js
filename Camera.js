function Camera(params) {
  // represents the camera
  this.eye = params.eye //vec3
  this.center = params.center // vec3
  this.up = params.up // vec 3
  this.fov = params.fov
  this.aspect = params.a

  // this.viewMat = mat4.create();
  // mat4.lookAt(this.viewMat, this.eye, this.center, this.up)

  // this.projectionMat = mat4.create()
  // mat4.perspective(this.projectionMat, this.fov, this.a, 0.01, 10000.0)

  let gaze = vec3.create()
  vec3.sub(gaze, this.center, this.eye)

  /* ORTHANORMAL BASIS */
  this.u = vec3.create()
  this.v = vec3.create()
  this.w = vec3.create()

  // W
  vec3.normalize(this.w, vec3.negate(vec3.create(), gaze))

  // U
  vec3.normalize(this.u, vec3.cross(vec3.create(), gaze, this.up))

  // V 
  vec3.cross(this.v, this.w, this.u)

  // CREATE BASIS 
  this.orthoBasis = mat3.fromValues(
    this.u[0], this.u[1], this.u[2],
    this.v[0], this.v[1], this.v[2],
    this.w[0], this.w[1], this.w[2],
  )

  /** IMAGE PLANE DIMENSIONS */
  this.d = vec3.dist(this.center, this.eye)

  this.h = 2.0 * this.d * Math.tan(this.fov / 2.0)

  this.wid = this.aspect * this.h
}