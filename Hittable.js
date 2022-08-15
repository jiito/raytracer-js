 //function HittableList(objects){
//   this.objects = objects // list of hittable objects
// }
/**
 * Function to return a bounding box for a list of objects. If a bounding box does not exist, then it returns undefined. On succes, the bounding box for the list of objects is returned. 
 */

// HittableList.prototype.boundingBox = function (){
//   console.log('called')
//   if (!this.objects) return undefined

//   let outBox = new AABB();
//   let firstBox = true
//   for (const obj of this.objects){
//     bb = obj.boundingBox()
//     if (!bb) return undefined 

//     outBox = firstBox ? bb : surroundingBox(outBox, bb) 
//   }
//   return outBox
// }

/**
 * Create a surrounding box from two bounding boxes. 
 */
function surroundingBox(a, b){
  let small = vec3.fromValues(
    Math.min(a.min[0], b.min[0]), // x
    Math.min(a.min[1], b.min[1]), // y 
    Math.min(a.min[2], b.min[2]), // z
  )

  let big = vec3.fromValues(
    Math.max(a.max[0], b.max[0]), // x
    Math.max(a.max[1], b.max[1]), // y 
    Math.max(a.max[2], b.max[2]), // z
  )

  return new AABB(small, big)
  
}
/**
 * COMPARISON FUNCTIONS
 */
function boxCompareX(a, b){
  return boxCompare(a, b, 0)
}
function boxCompareY(a, b){
  return boxCompare(a, b, 1)
}
function boxCompareZ(a, b){
  return boxCompare(a, b, 2)
}

function boxCompare(a, b, axis){
  let box_a = a.boundingBox()
  let box_b = b.boundingBox()
  return box_a.min[axis] < box_b.min[axis]
}

function BVHNode(srcObjects, start, end){

  // creates the rest of the nodes in the constructor (left, right)
  this.objects = [...srcObjects]

  // create comparators
  let axis = Math.floor(Math.random() * 2.0) 
  let comparatorfunc = axis === 0 ? boxCompareX : ((axis === 1) ? boxCompareY : boxCompareZ)

  let object_span = end - start

  if (object_span === 1){
    // duplicate and put in both left and right 
    this.left = this.objects[start]
    this.right = this.objects[start]

  }else if (object_span === 2) {
    // compoare left and right 
    if(comparatorfunc(this.objects[start], this.objects[start+1])){
      this.left = this.objects[start]
      this.right = this.objects[start+1]
    }else {
      this.left = this.objects[start+1]
      this.right = this.objects[start]
    }
  }else {
    // sort and split

    let begA = this.objects.slice(0, start); 
    let midA = this.objects.slice(start, end);
    let endA = this.objects.slice(end, this.objects.length)

    midA.sort(comparatorfunc)

    this.objects = [...begA, ...midA, ...endA]

    let mid = Math.floor(start + (object_span / 2))

    this.left = new BVHNode(this.objects, start, mid)

    this.right = new BVHNode(this.objects, mid, end)
  }


  // created bboxes for left and right 
  // if it is a BVHNode, use the HittableList bounding box 
  // if it is just a triangle or sphere, it should not have a hit list and we will
  // want to just use it's bounding box

  let lbb = this.left.boundingBox()
  let rbb = this.right.boundingBox()

  if (!lbb || !rbb) console.error("No left or right bounding box")
  // create bounding box for the node 
  this.box = surroundingBox(lbb, rbb)
}

BVHNode.prototype.boundingBox = function() {
  return this.box
}

/**
 * Function to determine if hit the bvh node. 
 * This could be an intersection with an object or hitting a bounding box. 
 */
let totalHits = 0;
let bothDefined = 0
BVHNode.prototype.hit = function(ray, tmin, tmax) {
  if (!this.box.hit(ray, tmin, tmax)){
    return undefined
  }
  totalHits++
  // check the left and right nodes 
  let leftHit = this.left.hit(ray, tmin, tmax)
  let rightHit = this.right.hit(ray, tmin, leftHit ? leftHit.param_t : tmax)
  
  if (leftHit && rightHit){
    bothDefined ++
  }


  return rightHit ?? leftHit
}