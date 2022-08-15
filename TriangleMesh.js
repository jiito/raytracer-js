function TriangleMesh(mesh, material, modelMat){ // hitable list
  this.triangles = []
  this.vertices = mesh.vertices
  this.normals = mesh.normals
  this.parameter = mesh.parameter
  this.material = material
  this.modelMat = modelMat

  
  this.mulModelMat()
  this.generateTriangles()

  // for hitable 
  this.objects = this.triangles
}

TriangleMesh.prototype.mulModelMat = function(){
  for (let i = 0; i < this.vertices.length / 3 ; i++){
    let v = vec4.fromValues(this.vertices[3*i], this.vertices[3*i+1], this.vertices[3*i+2], 0)


    // console.log(this.modelMat)
    // multiply by model mat 
    vec4.transformMat4(v, v, this.modelMat)

    //save back 
    for (let j = 0; j < 3; j++){
      this.vertices[3*i+j] = v[j]
    }
  }
}

/**
 * Generate the triangle objects for the mesh
 */
TriangleMesh.prototype.generateTriangles = function(){
  this.nb_triangles = this.vertices.length / 9 

  for (let i = 0; i < this.nb_triangles; i++){
    let i1 = 3 * i 
    let i2 = 3 * i + 1
    let i3 = 3 * i + 2

    let p1 = vec3.fromValues(this.vertices[3*i1], this.vertices[3*i1 +1], this.vertices[3*i1 +2])
    let p2 = vec3.fromValues(this.vertices[3*i2], this.vertices[3*i2 +1], this.vertices[3*i2 +2])
    let p3 = vec3.fromValues(this.vertices[3*i3], this.vertices[3*i3 +1], this.vertices[3*i3 +2])

    // create Triangle
    this.triangles.push(new Triangle(p1, p2, p3, this, i))
  }
}

/**
 * Interface that is hitable. Stores the points of the triangle and the mesh 
 */
function Triangle(p1, p2, p3, mesh, i) {
  this.p1 = p1
  this.p2 = p2
  this.p3 = p3
  this.mesh = mesh
  this.i = i 
}

/**
 * Function to generate the bounding box of a triangle
 * @returns AABB - the bounding box
 */
Triangle.prototype.boundingBox = function (){
  // let min = vec3.fromValues(
  //   Math.min(this.p1[0], Math.min(this.p2[0], this.p3[0])),
  //   Math.min(this.p1[1], Math.min(this.p2[1], this.p3[1])),
  //   Math.min(this.p1[2], Math.min(this.p2[2], this.p3[2])),
  // )
  // let max = vec3.fromValues(
  //   Math.max(this.p1[0], Math.max(this.p2[0], this.p3[0])),
  //   Math.max(this.p1[1], Math.max(this.p2[1], this.p3[1])),
  //   Math.max(this.p1[2], Math.max(this.p2[2], this.p3[2])),
  // )

  let min = vec3.create()
  let max = vec3.create()
  
  vec3.min(min, this.p1, vec3.min(vec3.create(), this.p2, this.p3))
  vec3.max(max, this.p1, vec3.max(vec3.create(), this.p2, this.p3))
  this.box = new AABB(min, max)
  return this.box
}

/**
 * Function to determine if a ray has intersected a triangle
 * @returns the closest intersection
 */
let totalTrianglesHit = 0;
Triangle.prototype.hit = function (ray, tmin, tmax) {
  totalTrianglesHit++;
  let p1p3 = vec3.create()
  let r = ray.direction
  let p2p3 = vec3.create()
  let neg_r = vec3.create()
  let ep3 = vec3.create()
  let eye = ray.x0


  vec3.sub(p1p3, this.p1, this.p3)
  vec3.sub(p2p3, this.p2, this.p3)

  // negate r
  vec3.negate(neg_r, r);

  // create e - p3 
  vec3.sub(ep3, eye, this.p3);

  let M = mat3.fromValues(
    p1p3[0], p1p3[1], p1p3[2],
    p2p3[0], p2p3[1], p2p3[2],
    neg_r[0], neg_r[1], neg_r[2]);

  // invert the mat 
  mat3.invert(M, M);

  let p = vec3.create();
  vec3.transformMat3(p, ep3, M);
  let gamma = 1 - p[0] - p[1];
  let t = p[2]
  if (t < tmin || t > tmax) return undefined

  if (p[0] > 1 || p[1] > 1 || p[0] < 0 || p[1] < 0 || gamma > 1 || gamma < 0) return undefined

  let point = vec3.create();
  vec3.add(point, eye, vec3.scale(vec3.create(), r, p[2]))

  // NORMAL 
  // get vertice normals
  let i1 = 3 * this.i 
  let i2 = 3 * this.i + 1
  let i3 = 3 * this.i + 2
  let n1 = vec3.fromValues(this.mesh.normals[3*i1], this.mesh.normals[3*i1 +1], this.mesh.normals[3*i1 +1])
  let n2 = vec3.fromValues(this.mesh.normals[3*i2], this.mesh.normals[3*i2 +1], this.mesh.normals[3*i2 +1])
  let n3 = vec3.fromValues(this.mesh.normals[3*i3], this.mesh.normals[3*i3 +1], this.mesh.normals[3*i3 +1])

  // interpolate normals 
  vec3.scale(n1, n1, p[0])
  vec3.scale(n2, n2, p[1])
  vec3.scale(n3, n3, gamma)

  let normal = vec3.create()
  vec3.normalize(normal, n1, vec3.add(vec3.create(), n2, n3))

  return new Intersection(t, this.mesh, point, normal) ;

}


/**
 * NOT USED IN BVH 
 * intersects a triangle, provided to the function 
 */
TriangleMesh.prototype.intersectT = function (ray, triangle, tmin, tmax, i) {

  let p1p3 = vec3.create()
  let r = ray.direction
  let p2p3 = vec3.create()
  let neg_r = vec3.create()
  let ep3 = vec3.create()
  let eye = ray.x0

  vec3.sub(p1p3, triangle.p1, triangle.p3)
  vec3.sub(p2p3, triangle.p2, triangle.p3)

  // negate r
  vec3.negate(neg_r, r);

  // create e - p3 
  vec3.sub(ep3, eye, triangle.p3);

  let M = mat3.fromValues(
    p1p3[0], p1p3[1], p1p3[2],
    p2p3[0], p2p3[1], p2p3[2],
    neg_r[0], neg_r[1], neg_r[2]);

  // invert the mat 
  mat3.invert(M, M);

  let p = vec3.create();
  vec3.transformMat3(p, ep3, M);
  let gamma = 1 - p[0] - p[1];
  let t = p[2]
  if (t < tmin || t > tmax) return undefined

  if (p[0] > 1 || p[1] > 1 || p[0] < 0 || p[1] < 0 || gamma > 1 || gamma < 0) return undefined

  let point = vec3.create();
  vec3.add(point, eye, vec3.scale(vec3.create(), r, p[2]))

  // NORMAL 
  // get vertice normals
  let i1 = 3 * i 
  let i2 = 3 * i + 1
  let i3 = 3 * i + 2
  let n1 = vec3.fromValues(this.normals[3*i1], this.normals[3*i1 +1], this.normals[3*i1 +1])
  let n2 = vec3.fromValues(this.normals[3*i2], this.normals[3*i2 +1], this.normals[3*i2 +1])
  let n3 = vec3.fromValues(this.normals[3*i3], this.normals[3*i3 +1], this.normals[3*i3 +1])

  // interpolate normals 
  vec3.scale(n1, n1, p[0])
  vec3.scale(n2, n2, p[1])
  vec3.scale(n3, n3, gamma)

  let normal = vec3.create()
  vec3.normalize(normal, n1, vec3.add(vec3.create(), n2, n3))

  return new Intersection(t, this, point, normal) ;
}

/**
 * NOT USED BY BVH
 * Function to iterate through the triangles and determine which are intersected 
 * @returns Intersection - min intersection for point
 */
TriangleMesh.prototype.intersect = function(ray, tmin, tmax){
  let minIntersection = {param_t: Infinity}
  for (let i = 0; i < this.nb_triangles; i++){
    let intersection = this.intersectT(ray, this.triangles[i], 0.001, 1e20, i)
    if (intersection){
      if (intersection.param_t <minIntersection.param_t) {
        minIntersection = intersection
      }
    }
  }
  return minIntersection
}