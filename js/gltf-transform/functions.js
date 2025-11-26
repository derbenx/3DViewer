import { Primitive, PropertyType, Document, getBounds as getBounds$1, Scene, BufferUtils, MathUtils, Accessor, Mesh, ComponentTypeToTypedArray, Root, TextureInfo, Texture, ExtensionProperty, AnimationChannel, Material, ColorUtils, ImageUtils, TextureChannel, Node, PrimitiveTarget, AnimationSampler, uuid, FileUtils } from '@gltf-transform/core';
import { getPixels, savePixels } from 'ndarray-pixels';
import { KHRMeshQuantization, KHRDracoMeshCompression, EXTMeshGPUInstancing, EXTMeshoptCompression, KHRMaterialsIOR, KHRMaterialsSpecular, KHRMaterialsPBRSpecularGlossiness, EXTTextureWebP, EXTTextureAVIF, KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { read, KHR_DF_MODEL_ETC1S, KHR_DF_MODEL_UASTC } from 'ktx-parse';
import ndarray from 'ndarray';
import { lanczos3, lanczos2 } from 'ndarray-lanczos';

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

const {
  POINTS: POINTS$1,
  LINES: LINES$2,
  LINE_STRIP: LINE_STRIP$3,
  LINE_LOOP: LINE_LOOP$3,
  TRIANGLES: TRIANGLES$2,
  TRIANGLE_STRIP: TRIANGLE_STRIP$3,
  TRIANGLE_FAN: TRIANGLE_FAN$3
} = Primitive.Mode;
/**
 * Prepares a function used in an {@link Document#transform} pipeline. Use of this wrapper is
 * optional, and plain functions may be used in transform pipelines just as well. The wrapper is
 * used internally so earlier pipeline stages can detect and optimize based on later stages.
 * @hidden
 */
function createTransform(name, fn) {
  Object.defineProperty(fn, 'name', {
    value: name
  });
  return fn;
}
/** @hidden */
function isTransformPending(context, initial, pending) {
  if (!context) return false;
  const initialIndex = context.stack.lastIndexOf(initial);
  const pendingIndex = context.stack.lastIndexOf(pending);
  return initialIndex < pendingIndex;
}
/**
 * Performs a shallow merge on an 'options' object and a 'defaults' object.
 * Equivalent to `{...defaults, ...options}` _except_ that `undefined` values
 * in the 'options' object are ignored.
 *
 * @hidden
 */
function assignDefaults(defaults, options) {
  const result = _extends({}, defaults);
  for (const key in options) {
    if (options[key] !== undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: TODO
      result[key] = options[key];
    }
  }
  return result;
}
/**
 * Maps pixels from source to target textures, with a per-pixel callback.
 * @hidden
 */
async function rewriteTexture(source, target, fn) {
  if (!source) return null;
  const srcImage = source.getImage();
  if (!srcImage) return null;
  const pixels = await getPixels(srcImage, source.getMimeType());
  for (let i = 0; i < pixels.shape[0]; ++i) {
    for (let j = 0; j < pixels.shape[1]; ++j) {
      fn(pixels, i, j);
    }
  }
  const dstImage = await savePixels(pixels, 'image/png');
  return target.setImage(dstImage).setMimeType('image/png');
}
/** @hidden */
function getGLPrimitiveCount(prim) {
  const indices = prim.getIndices();
  const position = prim.getAttribute('POSITION');
  // Reference: https://www.khronos.org/opengl/wiki/Primitive
  switch (prim.getMode()) {
    case Primitive.Mode.POINTS:
      return indices ? indices.getCount() : position.getCount();
    case Primitive.Mode.LINES:
      return indices ? indices.getCount() / 2 : position.getCount() / 2;
    case Primitive.Mode.LINE_LOOP:
      return indices ? indices.getCount() : position.getCount();
    case Primitive.Mode.LINE_STRIP:
      return indices ? indices.getCount() - 1 : position.getCount() - 1;
    case Primitive.Mode.TRIANGLES:
      return indices ? indices.getCount() / 3 : position.getCount() / 3;
    case Primitive.Mode.TRIANGLE_STRIP:
    case Primitive.Mode.TRIANGLE_FAN:
      return indices ? indices.getCount() - 2 : position.getCount() - 2;
    default:
      throw new Error('Unexpected mode: ' + prim.getMode());
  }
}
/** @hidden */
class SetMap {
  constructor() {
    this._map = new Map();
  }
  get size() {
    return this._map.size;
  }
  has(k) {
    return this._map.has(k);
  }
  add(k, v) {
    let entry = this._map.get(k);
    if (!entry) {
      entry = new Set();
      this._map.set(k, entry);
    }
    entry.add(v);
    return this;
  }
  get(k) {
    return this._map.get(k) || new Set();
  }
  keys() {
    return this._map.keys();
  }
}
/** @hidden */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
const _longFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0
});
/** @hidden */
function formatLong(x) {
  return _longFormatter.format(x);
}
/** @hidden */
function formatDelta(a, b, decimals = 2) {
  const prefix = a > b ? '–' : '+';
  const suffix = '%';
  return prefix + (Math.abs(a - b) / a * 100).toFixed(decimals) + suffix;
}
/** @hidden */
function formatDeltaOp(a, b) {
  return `${formatLong(a)} → ${formatLong(b)} (${formatDelta(a, b)})`;
}
/**
 * Returns a list of all unique vertex attributes on the given primitive and
 * its morph targets.
 * @hidden
 */
function deepListAttributes(prim) {
  const accessors = [];
  for (const attribute of prim.listAttributes()) {
    accessors.push(attribute);
  }
  for (const target of prim.listTargets()) {
    for (const attribute of target.listAttributes()) {
      accessors.push(attribute);
    }
  }
  return Array.from(new Set(accessors));
}
/** @hidden */
function deepSwapAttribute(prim, src, dst) {
  prim.swap(src, dst);
  for (const target of prim.listTargets()) {
    target.swap(src, dst);
  }
}
/**
 * Disposes of a {@link Primitive} and any {@link Accessor Accesors} for which
 * it is the last remaining parent.
 * @hidden
 */
function deepDisposePrimitive(prim) {
  const indices = prim.getIndices();
  const attributes = deepListAttributes(prim);
  prim.dispose();
  if (indices && !isUsed(indices)) {
    indices.dispose();
  }
  for (const attribute of attributes) {
    if (!isUsed(attribute)) {
      attribute.dispose();
    }
  }
}
/** @hidden */
function shallowEqualsArray(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
/** Clones an {@link Accessor} without creating a copy of its underlying TypedArray data. */
function shallowCloneAccessor(document, accessor) {
  return document.createAccessor(accessor.getName()).setArray(accessor.getArray()).setType(accessor.getType()).setBuffer(accessor.getBuffer()).setNormalized(accessor.getNormalized()).setSparse(accessor.getSparse());
}
/** @hidden */
function createIndices(count, maxIndex = count) {
  const array = createIndicesEmpty(count, maxIndex);
  for (let i = 0; i < array.length; i++) array[i] = i;
  return array;
}
/** @hidden */
function createIndicesEmpty(count, maxIndex = count) {
  return maxIndex <= 65534 ? new Uint16Array(count) : new Uint32Array(count);
}
/** @hidden */
function isUsed(prop) {
  return prop.listParents().some(parent => parent.propertyType !== PropertyType.ROOT);
}
/** @hidden */
function isEmptyObject(object) {
  for (const _key in object) return false;
  return true;
}
/**
 * Creates a unique key associated with the structure and draw call characteristics of
 * a {@link Primitive}, independent of its vertex content. Helper method, used to
 * identify candidate Primitives for joining.
 * @hidden
 */
function createPrimGroupKey(prim) {
  const document = Document.fromGraph(prim.getGraph());
  const material = prim.getMaterial();
  const materialIndex = document.getRoot().listMaterials().indexOf(material);
  const mode = BASIC_MODE_MAPPING[prim.getMode()];
  const indices = !!prim.getIndices();
  const attributes = prim.listSemantics().sort().map(semantic => {
    const attribute = prim.getAttribute(semantic);
    const elementSize = attribute.getElementSize();
    const componentType = attribute.getComponentType();
    return `${semantic}:${elementSize}:${componentType}`;
  }).join('+');
  const targets = prim.listTargets().map(target => {
    return target.listSemantics().sort().map(semantic => {
      const attribute = prim.getAttribute(semantic);
      const elementSize = attribute.getElementSize();
      const componentType = attribute.getComponentType();
      return `${semantic}:${elementSize}:${componentType}`;
    }).join('+');
  }).join('~');
  return `${materialIndex}|${mode}|${indices}|${attributes}|${targets}`;
}
/**
 * Scales `size` NxN dimensions to fit within `limit` NxN dimensions, without
 * changing aspect ratio. If `size` <= `limit` in all dimensions, returns `size`.
 * @hidden
 */
function fitWithin(size, limit) {
  const [maxWidth, maxHeight] = limit;
  const [srcWidth, srcHeight] = size;
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) return size;
  let dstWidth = srcWidth;
  let dstHeight = srcHeight;
  if (dstWidth > maxWidth) {
    dstHeight = Math.floor(dstHeight * (maxWidth / dstWidth));
    dstWidth = maxWidth;
  }
  if (dstHeight > maxHeight) {
    dstWidth = Math.floor(dstWidth * (maxHeight / dstHeight));
    dstHeight = maxHeight;
  }
  return [dstWidth, dstHeight];
}
/**
 * Scales `size` NxN dimensions to the specified power of two.
 * @hidden
 */
function fitPowerOfTwo(size, method) {
  if (isPowerOfTwo(size[0]) && isPowerOfTwo(size[1])) {
    return size;
  }
  switch (method) {
    case 'nearest-pot':
      return size.map(nearestPowerOfTwo);
    case 'ceil-pot':
      return size.map(ceilPowerOfTwo$1);
    case 'floor-pot':
      return size.map(floorPowerOfTwo);
  }
}
function isPowerOfTwo(value) {
  if (value <= 2) return true;
  return (value & value - 1) === 0 && value !== 0;
}
function nearestPowerOfTwo(value) {
  if (value <= 4) return 4;
  const lo = floorPowerOfTwo(value);
  const hi = ceilPowerOfTwo$1(value);
  if (hi - value > value - lo) return lo;
  return hi;
}
function floorPowerOfTwo(value) {
  return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}
function ceilPowerOfTwo$1(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}
/**
 * Mapping from any glTF primitive mode to its equivalent basic mode, as returned by
 * {@link convertPrimitiveMode}.
 * @hidden
 */
const BASIC_MODE_MAPPING = {
  [POINTS$1]: POINTS$1,
  [LINES$2]: LINES$2,
  [LINE_STRIP$3]: LINES$2,
  [LINE_LOOP$3]: LINES$2,
  [TRIANGLES$2]: TRIANGLES$2,
  [TRIANGLE_STRIP$3]: TRIANGLES$2,
  [TRIANGLE_FAN$3]: TRIANGLES$2
};

const NAME$q = 'center';
const CENTER_DEFAULTS = {
  pivot: 'center'
};
/**
 * Centers the {@link Scene} at the origin, or above/below it. Transformations from animation,
 * skinning, and morph targets are not taken into account.
 *
 * Example:
 *
 * ```ts
 * await document.transform(center({pivot: 'below'}));
 * ```
 *
 * @category Transforms
 */
function center(_options = CENTER_DEFAULTS) {
  const options = assignDefaults(CENTER_DEFAULTS, _options);
  return createTransform(NAME$q, doc => {
    const logger = doc.getLogger();
    const root = doc.getRoot();
    const isAnimated = root.listAnimations().length > 0 || root.listSkins().length > 0;
    doc.getRoot().listScenes().forEach((scene, index) => {
      logger.debug(`${NAME$q}: Scene ${index + 1} / ${root.listScenes().length}.`);
      let pivot;
      if (typeof options.pivot === 'string') {
        const bbox = getBounds$1(scene);
        pivot = [(bbox.max[0] - bbox.min[0]) / 2 + bbox.min[0], (bbox.max[1] - bbox.min[1]) / 2 + bbox.min[1], (bbox.max[2] - bbox.min[2]) / 2 + bbox.min[2]];
        if (options.pivot === 'above') pivot[1] = bbox.max[1];
        if (options.pivot === 'below') pivot[1] = bbox.min[1];
      } else {
        pivot = options.pivot;
      }
      logger.debug(`${NAME$q}: Pivot "${pivot.join(', ')}".`);
      const offset = [-1 * pivot[0], -1 * pivot[1], -1 * pivot[2]];
      if (isAnimated) {
        logger.debug(`${NAME$q}: Model contains animation or skin. Adding a wrapper node.`);
        const offsetNode = doc.createNode('Pivot').setTranslation(offset);
        scene.listChildren().forEach(child => offsetNode.addChild(child));
        scene.addChild(offsetNode);
      } else {
        logger.debug(`${NAME$q}: Skipping wrapper, offsetting all root nodes.`);
        scene.listChildren().forEach(child => {
          const t = child.getTranslation();
          child.setTranslation([t[0] + offset[0], t[1] + offset[1], t[2] + offset[2]]);
        });
      }
    });
    logger.debug(`${NAME$q}: Complete.`);
  });
}

/**
 * Finds the parent {@link Scene Scenes} associated with the given {@link Node}.
 * In most cases a Node is associated with only one Scene, but it is possible
 * for a Node to be located in two or more Scenes, or none at all.
 *
 * Example:
 *
 * ```typescript
 * import { listNodeScenes } from '@gltf-transform/functions';
 *
 * const node = document.getRoot().listNodes()
 *  .find((node) => node.getName() === 'MyNode');
 *
 * const scenes = listNodeScenes(node);
 * ```
 */
function listNodeScenes(node) {
  const visited = new Set();
  let child = node;
  let parent;
  while (parent = child.getParentNode()) {
    if (visited.has(parent)) {
      throw new Error('Circular dependency in scene graph.');
    }
    visited.add(parent);
    child = parent;
  }
  return child.listParents().filter(parent => parent instanceof Scene);
}

/**
 * Clears the parent of the given {@link Node}, leaving it attached
 * directly to its {@link Scene}. Inherited transforms will be applied
 * to the Node. This operation changes the Node's local transform,
 * but leaves its world transform unchanged.
 *
 * Example:
 *
 * ```typescript
 * import { clearNodeParent } from '@gltf-transform/functions';
 *
 * scene.traverse((node) => { ... }); // Scene → … → Node
 *
 * clearNodeParent(node);
 *
 * scene.traverse((node) => { ... }); // Scene → Node
 * ```
 *
 * To clear _all_ transforms of a Node, first clear its inherited transforms with
 * {@link clearNodeParent}, then clear the local transform with {@link clearNodeTransform}.
 */
function clearNodeParent(node) {
  const scenes = listNodeScenes(node);
  const parent = node.getParentNode();
  if (!parent) return node;
  // Apply inherited transforms to local matrix. Skinned meshes are not affected
  // by the node parent's transform, and can be ignored. Updates to IBMs and TRS
  // animations are out of scope in this context.
  node.setMatrix(node.getWorldMatrix());
  // Add to Scene roots.
  parent.removeChild(node);
  for (const scene of scenes) scene.addChild(node);
  return node;
}

/**
 * Common utilities
 * @module glMatrix
 */
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert$1(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply$2(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */

function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Various methods of estimating a vertex count. For some background on why
 * multiple definitions of a vertex count should exist, see [_Vertex Count
 * Higher in Engine than in 3D Software_](https://shahriyarshahrabi.medium.com/vertex-count-higher-in-engine-than-in-3d-software-badc348ada66).
 * Totals for a {@link Scene}, {@link Node}, or {@link Mesh} will not
 * necessarily match the sum of the totals for each {@link Primitive}. Choose
 * the appropriate method for a relevant total or estimate:
 *
 * - {@link getSceneVertexCount}
 * - {@link getNodeVertexCount}
 * - {@link getMeshVertexCount}
 * - {@link getPrimitiveVertexCount}
 *
 * Many rendering features, such as volumetric transmission, may lead
 * to additional passes over some or all vertices. These tradeoffs are
 * implementation-dependent, and not considered here.
 */
var VertexCountMethod;
(function (VertexCountMethod) {
  /**
   * Expected number of vertices processed by the vertex shader for one render
   * pass, without considering the vertex cache.
   */
  VertexCountMethod["RENDER"] = "render";
  /**
   * Expected number of vertices processed by the vertex shader for one render
   * pass, assuming an Average Transform to Vertex Ratio (ATVR) of 1. Approaching
   * this result requires optimizing for locality of vertex references (see
   * {@link reorder}).
   *
   * References:
   * - [ACMR and ATVR](https://www.realtimerendering.com/blog/acmr-and-atvr/), Real-Time Rendering
   */
  VertexCountMethod["RENDER_CACHED"] = "render-cached";
  /**
   * Expected number of vertices uploaded to the GPU, assuming that a client
   * uploads each unique {@link Accessor} only once. Unless glTF vertex
   * attributes are pre-processed to a known buffer layout, and the client is
   * optimized for that buffer layout, this total will be optimistic.
   */
  VertexCountMethod["UPLOAD"] = "upload";
  /**
   * Expected number of vertices uploaded to the GPU, assuming that a client
   * uploads each unique {@link Primitive} individually, duplicating vertex
   * attribute {@link Accessor Accessors} shared by multiple primitives, but
   * never uploading the same Mesh or Primitive to GPU memory more than once.
   */
  VertexCountMethod["UPLOAD_NAIVE"] = "upload-naive";
  /**
   * Total number of unique vertices represented, considering all attributes of
   * each vertex, and removing any duplicates. Has no direct relationship to
   * runtime characteristics, but may be helpful in identifying asset
   * optimization opportunities.
   *
   * @hidden TODO(feat): Not yet implemented.
   * @internal
   */
  VertexCountMethod["DISTINCT"] = "distinct";
  /**
   * Total number of unique vertices represented, considering only vertex
   * positions, and removing any duplicates. Has no direct relationship to
   * runtime characteristics, but may be helpful in identifying asset
   * optimization opportunities.
   *
   * @hidden TODO(feat): Not yet implemented.
   * @internal
   */
  VertexCountMethod["DISTINCT_POSITION"] = "distinct-position";
  /**
   * Number of vertex positions never used by any {@link Primitive}. If all
   * vertices are unused, this total will match `UPLOAD`.
   */
  VertexCountMethod["UNUSED"] = "unused";
})(VertexCountMethod || (VertexCountMethod = {}));
/**
 * Computes total number of vertices in a {@link Scene}, by the
 * specified method. Totals for the Scene will not necessarily match the sum
 * of the totals for each {@link Mesh} or {@link Primitive} within it. See
 * {@link VertexCountMethod} for available methods.
 */
function getSceneVertexCount(scene, method) {
  return _getSubtreeVertexCount(scene, method);
}
/**
 * Computes total number of vertices in a {@link Node}, by the
 * specified method. Totals for the node will not necessarily match the sum
 * of the totals for each {@link Mesh} or {@link Primitive} within it. See
 * {@link VertexCountMethod} for available methods.
 */
function getNodeVertexCount(node, method) {
  return _getSubtreeVertexCount(node, method);
}
function _getSubtreeVertexCount(node, method) {
  const instancedMeshes = [];
  const nonInstancedMeshes = [];
  const meshes = [];
  node.traverse(node => {
    const mesh = node.getMesh();
    const batch = node.getExtension('EXT_mesh_gpu_instancing');
    if (batch && mesh) {
      meshes.push(mesh);
      instancedMeshes.push([batch.listAttributes()[0].getCount(), mesh]);
    } else if (mesh) {
      meshes.push(mesh);
      nonInstancedMeshes.push(mesh);
    }
  });
  const prims = meshes.flatMap(mesh => mesh.listPrimitives());
  const positions = prims.map(prim => prim.getAttribute('POSITION'));
  const uniquePositions = Array.from(new Set(positions));
  const uniqueMeshes = Array.from(new Set(meshes));
  const uniquePrims = Array.from(new Set(uniqueMeshes.flatMap(mesh => mesh.listPrimitives())));
  switch (method) {
    case VertexCountMethod.RENDER:
    case VertexCountMethod.RENDER_CACHED:
      return _sum(nonInstancedMeshes.map(mesh => getMeshVertexCount(mesh, method))) + _sum(instancedMeshes.map(([batch, mesh]) => batch * getMeshVertexCount(mesh, method)));
    case VertexCountMethod.UPLOAD_NAIVE:
      return _sum(uniqueMeshes.map(mesh => getMeshVertexCount(mesh, method)));
    case VertexCountMethod.UPLOAD:
      return _sum(uniquePositions.map(attribute => attribute.getCount()));
    case VertexCountMethod.DISTINCT:
    case VertexCountMethod.DISTINCT_POSITION:
      return _assertNotImplemented(method);
    case VertexCountMethod.UNUSED:
      return _sumUnused(uniquePrims);
    default:
      return _assertUnreachable(method);
  }
}
/**
 * Computes total number of vertices in a {@link Mesh}, by the
 * specified method. Totals for the Mesh will not necessarily match the sum
 * of the totals for each {@link Primitive} within it. See
 * {@link VertexCountMethod} for available methods.
 */
function getMeshVertexCount(mesh, method) {
  const prims = mesh.listPrimitives();
  const uniquePrims = Array.from(new Set(prims));
  const uniquePositions = Array.from(new Set(uniquePrims.map(prim => prim.getAttribute('POSITION'))));
  switch (method) {
    case VertexCountMethod.RENDER:
    case VertexCountMethod.RENDER_CACHED:
    case VertexCountMethod.UPLOAD_NAIVE:
      return _sum(prims.map(prim => getPrimitiveVertexCount(prim, method)));
    case VertexCountMethod.UPLOAD:
      return _sum(uniquePositions.map(attribute => attribute.getCount()));
    case VertexCountMethod.DISTINCT:
    case VertexCountMethod.DISTINCT_POSITION:
      return _assertNotImplemented(method);
    case VertexCountMethod.UNUSED:
      return _sumUnused(uniquePrims);
    default:
      return _assertUnreachable(method);
  }
}
/**
 * Computes total number of vertices in a {@link Primitive}, by the
 * specified method. See {@link VertexCountMethod} for available methods.
 */
function getPrimitiveVertexCount(prim, method) {
  const position = prim.getAttribute('POSITION');
  const indices = prim.getIndices();
  switch (method) {
    case VertexCountMethod.RENDER:
      return indices ? indices.getCount() : position.getCount();
    case VertexCountMethod.RENDER_CACHED:
      return indices ? new Set(indices.getArray()).size : position.getCount();
    case VertexCountMethod.UPLOAD_NAIVE:
    case VertexCountMethod.UPLOAD:
      return position.getCount();
    case VertexCountMethod.DISTINCT:
    case VertexCountMethod.DISTINCT_POSITION:
      return _assertNotImplemented(method);
    case VertexCountMethod.UNUSED:
      return indices ? position.getCount() - new Set(indices.getArray()).size : 0;
    default:
      return _assertUnreachable(method);
  }
}
function _sum(values) {
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    total += values[i];
  }
  return total;
}
function _sumUnused(prims) {
  const attributeIndexMap = new Map();
  for (const prim of prims) {
    const position = prim.getAttribute('POSITION');
    const indices = prim.getIndices();
    const indicesSet = attributeIndexMap.get(position) || new Set();
    indicesSet.add(indices);
    attributeIndexMap.set(position, indicesSet);
  }
  let unused = 0;
  for (const [position, indicesSet] of attributeIndexMap) {
    if (indicesSet.has(null)) continue;
    const usedIndices = new Uint8Array(position.getCount());
    for (const indices of indicesSet) {
      const indicesArray = indices.getArray();
      for (let i = 0, il = indicesArray.length; i < il; i++) {
        usedIndices[indicesArray[i]] = 1;
      }
    }
    for (let i = 0, il = position.getCount(); i < il; i++) {
      if (usedIndices[i] === 0) unused++;
    }
  }
  return unused;
}
function _assertNotImplemented(x) {
  throw new Error(`Not implemented: ${x}`);
}
function _assertUnreachable(x) {
  throw new Error(`Unexpected value: ${x}`);
}

/** Flags 'empty' values in a Uint32Array index. */
const EMPTY_U32$1 = 2 ** 32 - 1;
class VertexStream {
  constructor(prim) {
    this.attributes = [];
    /** Temporary vertex views in 4-byte-aligned memory. */
    this.u8 = void 0;
    this.u32 = void 0;
    let byteStride = 0;
    for (const attribute of deepListAttributes(prim)) {
      byteStride += this._initAttribute(attribute);
    }
    this.u8 = new Uint8Array(byteStride);
    this.u32 = new Uint32Array(this.u8.buffer);
  }
  _initAttribute(attribute) {
    const array = attribute.getArray();
    const u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    const byteStride = attribute.getElementSize() * attribute.getComponentSize();
    const paddedByteStride = BufferUtils.padNumber(byteStride);
    this.attributes.push({
      u8,
      byteStride,
      paddedByteStride
    });
    return paddedByteStride;
  }
  hash(index) {
    // Load vertex into 4-byte-aligned view.
    let byteOffset = 0;
    for (const {
      u8,
      byteStride,
      paddedByteStride
    } of this.attributes) {
      for (let i = 0; i < paddedByteStride; i++) {
        if (i < byteStride) {
          this.u8[byteOffset + i] = u8[index * byteStride + i];
        } else {
          this.u8[byteOffset + i] = 0;
        }
      }
      byteOffset += paddedByteStride;
    }
    // Compute hash.
    return murmurHash2(0, this.u32);
  }
  equal(a, b) {
    for (const {
      u8,
      byteStride
    } of this.attributes) {
      for (let j = 0; j < byteStride; j++) {
        if (u8[a * byteStride + j] !== u8[b * byteStride + j]) {
          return false;
        }
      }
    }
    return true;
  }
}
/**
 * References:
 * - https://github.com/mikolalysenko/murmurhash-js/blob/f19136e9f9c17f8cddc216ca3d44ec7c5c502f60/murmurhash2_gc.js#L14
 * - https://github.com/zeux/meshoptimizer/blob/e47e1be6d3d9513153188216455bdbed40a206ef/src/indexgenerator.cpp#L12
 */
function murmurHash2(h, key) {
  // MurmurHash2
  const m = 0x5bd1e995;
  const r = 24;
  for (let i = 0, il = key.length; i < il; i++) {
    let k = key[i];
    k = Math.imul(k, m) >>> 0;
    k = (k ^ k >> r) >>> 0;
    k = Math.imul(k, m) >>> 0;
    h = Math.imul(h, m) >>> 0;
    h = (h ^ k) >>> 0;
  }
  return h;
}
function hashLookup(table, buckets, stream, key, empty = EMPTY_U32$1) {
  const hashmod = buckets - 1;
  const hashval = stream.hash(key);
  let bucket = hashval & hashmod;
  for (let probe = 0; probe <= hashmod; probe++) {
    const item = table[bucket];
    if (item === empty || stream.equal(item, key)) {
      return bucket;
    }
    bucket = bucket + probe + 1 & hashmod; // Hash collision.
  }
  throw new Error('Hash table full.');
}

/**
 * Rewrites a {@link Primitive} such that all unused vertices in its vertex
 * attributes are removed. When multiple Primitives share vertex attributes,
 * each indexing only a few, compaction can be used to produce Primitives
 * each having smaller, independent vertex streams instead.
 *
 * Regardless of whether the Primitive is indexed or contains unused vertices,
 * compaction will clone every {@link Accessor}. The resulting Primitive will
 * share no Accessors with other Primitives, allowing later changes to
 * the vertex stream to be applied in isolation.
 *
 * Example:
 *
 * ```javascript
 * import { compactPrimitive, transformMesh } from '@gltf-transform/functions';
 * import { fromTranslation } from 'gl-matrix/mat4';
 *
 * const mesh = document.getRoot().listMeshes().find((mesh) => mesh.getName() === 'MyMesh');
 * const prim = mesh.listPrimitives().find((prim) => { ... });
 *
 * // Compact primitive, removing unused vertices and detaching shared vertex
 * // attributes. Without compaction, `transformPrimitive` might affect other
 * // primitives sharing the same vertex attributes.
 * compactPrimitive(prim);
 *
 * // Transform primitive vertices, y += 10.
 * transformPrimitive(prim, fromTranslation([], [0, 10, 0]));
 * ```
 *
 * Parameters 'remap' and 'dstVertexCount' are optional. When either is
 * provided, the other must be provided as well. If one or both are missing,
 * both will be computed from the mesh indices.
 *
 * @param remap - Mapping. Array index represents vertex index in the source
 *		attributes, array value represents index in the resulting compacted
 *		primitive. When omitted, calculated from indices.
 * @param dstVertexcount - Number of unique vertices in compacted primitive.
 *		When omitted, calculated from indices.
 */
// TODO(cleanup): Additional signatures currently break greendoc/parse.
// export function compactPrimitive(prim: Primitive): Primitive;
// export function compactPrimitive(prim: Primitive, remap: TypedArray, dstVertexCount: number): Primitive;
function compactPrimitive(prim, remap, dstVertexCount) {
  const document = Document.fromGraph(prim.getGraph());
  if (!remap || !dstVertexCount) {
    [remap, dstVertexCount] = createCompactPlan(prim);
  }
  // Remap indices.
  const srcIndices = prim.getIndices();
  const srcIndicesArray = srcIndices ? srcIndices.getArray() : null;
  const srcIndicesCount = getPrimitiveVertexCount(prim, VertexCountMethod.RENDER);
  const dstIndices = document.createAccessor();
  const dstIndicesCount = srcIndicesCount; // primitive count does not change.
  const dstIndicesArray = createIndicesEmpty(dstIndicesCount, dstVertexCount);
  for (let i = 0; i < dstIndicesCount; i++) {
    dstIndicesArray[i] = remap[srcIndicesArray ? srcIndicesArray[i] : i];
  }
  prim.setIndices(dstIndices.setArray(dstIndicesArray));
  // Remap vertices.
  const srcAttributesPrev = deepListAttributes(prim);
  for (const srcAttribute of prim.listAttributes()) {
    const dstAttribute = shallowCloneAccessor(document, srcAttribute);
    compactAttribute(srcAttribute, srcIndices, remap, dstAttribute, dstVertexCount);
    prim.swap(srcAttribute, dstAttribute);
  }
  for (const target of prim.listTargets()) {
    for (const srcAttribute of target.listAttributes()) {
      const dstAttribute = shallowCloneAccessor(document, srcAttribute);
      compactAttribute(srcAttribute, srcIndices, remap, dstAttribute, dstVertexCount);
      target.swap(srcAttribute, dstAttribute);
    }
  }
  // Clean up accessors.
  if (srcIndices && srcIndices.listParents().length === 1) {
    srcIndices.dispose();
  }
  for (const srcAttribute of srcAttributesPrev) {
    if (srcAttribute.listParents().length === 1) {
      srcAttribute.dispose();
    }
  }
  return prim;
}
/**
 * Copies srcAttribute to dstAttribute, using the given indices and remap (srcIndex -> dstIndex).
 * Any existing array in dstAttribute is replaced. Vertices not used by the index are eliminated,
 * leaving a compact attribute.
 * @hidden
 * @internal
 */
function compactAttribute(srcAttribute, srcIndices, remap, dstAttribute, dstVertexCount) {
  const elementSize = srcAttribute.getElementSize();
  const srcArray = srcAttribute.getArray();
  const srcIndicesArray = srcIndices ? srcIndices.getArray() : null;
  const srcIndicesCount = srcIndices ? srcIndices.getCount() : srcAttribute.getCount();
  const dstArray = new srcArray.constructor(dstVertexCount * elementSize);
  const dstDone = new Uint8Array(dstVertexCount);
  for (let i = 0; i < srcIndicesCount; i++) {
    const srcIndex = srcIndicesArray ? srcIndicesArray[i] : i;
    const dstIndex = remap[srcIndex];
    if (dstDone[dstIndex]) continue;
    for (let j = 0; j < elementSize; j++) {
      dstArray[dstIndex * elementSize + j] = srcArray[srcIndex * elementSize + j];
    }
    dstDone[dstIndex] = 1;
  }
  return dstAttribute.setArray(dstArray);
}
/**
 * Creates a 'remap' and 'dstVertexCount' plan for indexed primitives,
 * such that they can be rewritten with {@link compactPrimitive} removing
 * any non-rendered vertices.
 * @hidden
 * @internal
 */
function createCompactPlan(prim) {
  const srcVertexCount = getPrimitiveVertexCount(prim, VertexCountMethod.UPLOAD);
  const indices = prim.getIndices();
  const indicesArray = indices ? indices.getArray() : null;
  if (!indices || !indicesArray) {
    return [createIndices(srcVertexCount, 1000000), srcVertexCount];
  }
  const remap = new Uint32Array(srcVertexCount).fill(EMPTY_U32$1);
  let dstVertexCount = 0;
  for (let i = 0; i < indicesArray.length; i++) {
    const srcIndex = indicesArray[i];
    if (remap[srcIndex] === EMPTY_U32$1) {
      remap[srcIndex] = dstVertexCount++;
    }
  }
  return [remap, dstVertexCount];
}

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create$2() {
  var out = new ARRAY_TYPE(9);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }

  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}
/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {ReadonlyMat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */

function fromMat4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}
/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }

  return out;
}
/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20; // Calculate the determinant

  var det = a00 * b01 + a01 * b11 + a02 * b21;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$1() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function multiply$1(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale$1(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
/**
 * Alias for {@link vec3.multiply}
 * @function
 */

var mul$1 = multiply$1;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
})();

/**
 * CONTRIBUTOR NOTES
 *
 * Ideally a weld() implementation should be fast, robust, and tunable. The
 * writeup below tracks my attempts to solve for these constraints.
 *
 * (Approach #1) Follow the mergeVertices() implementation of three.js,
 * hashing vertices with a string concatenation of all vertex attributes.
 * The approach does not allow per-attribute tolerance in local units.
 *
 * (Approach #2) Sort points along the X axis, then make cheaper
 * searches up/down the sorted list for merge candidates. While this allows
 * simpler comparison based on specified tolerance, it's much slower, even
 * for cases where choice of the X vs. Y or Z axes is reasonable.
 *
 * (Approach #3) Attempted a Delaunay triangulation in three dimensions,
 * expecting it would be an n * log(n) algorithm, but the only implementation
 * I found (with delaunay-triangulate) appeared to be much slower than that,
 * and was notably slower than the sort-based approach, just building the
 * Delaunay triangulation alone.
 *
 * (Approach #4) Hybrid of (1) and (2), assigning vertices to a spatial
 * grid, then searching the local neighborhood (27 cells) for weld candidates.
 *
 * (Approach #5) Based on Meshoptimizer's implementation, when tolerance=0
 * use a hashtable to find bitwise-equal vertices quickly. Vastly faster than
 * previous approaches, but without tolerance options.
 *
 * RESULTS: For the "Lovecraftian" sample model linked below, after joining,
 * a primitive with 873,000 vertices can be welded down to 230,000 vertices.
 * https://sketchfab.com/3d-models/sculpt-january-day-19-lovecraftian-34ad2501108e4fceb9394f5b816b9f42
 *
 * - (1) Not tested, but prior results suggest not robust enough.
 * - (2) 30s
 * - (3) 660s
 * - (4) 5s exhaustive, 1.5s non-exhaustive
 * - (5) 0.2s
 *
 * As of April 2024, the lossy weld was removed, leaving only approach #5. An
 * upcoming Meshoptimizer release will include a simplifyWithAttributes
 * function allowing simplification with weighted consideration of vertex
 * attributes, which I hope to support. With that, weld() may remain faster,
 * simpler, and more maintainable.
 */
const NAME$p = 'weld';
const WELD_DEFAULTS = {
  overwrite: true
};
/**
 * Welds {@link Primitive Primitives}, merging bitwise identical vertices. When
 * merged and indexed, data is shared more efficiently between vertices. File size
 * can be reduced, and the GPU uses the vertex cache more efficiently.
 *
 * Example:
 *
 * ```javascript
 * import { weld, getSceneVertexCount, VertexCountMethod } from '@gltf-transform/functions';
 *
 * const scene = document.getDefaultScene();
 * const srcVertexCount = getSceneVertexCount(scene, VertexCountMethod.UPLOAD);
 * await document.transform(weld());
 * const dstVertexCount = getSceneVertexCount(scene, VertexCountMethod.UPLOAD);
 * ```
 *
 * @category Transforms
 */
function weld(_options = WELD_DEFAULTS) {
  const options = assignDefaults(WELD_DEFAULTS, _options);
  return createTransform(NAME$p, async doc => {
    const logger = doc.getLogger();
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        weldPrimitive(prim, options);
        if (getPrimitiveVertexCount(prim, VertexCountMethod.RENDER) === 0) {
          deepDisposePrimitive(prim);
        }
      }
      if (mesh.listPrimitives().length === 0) mesh.dispose();
    }
    logger.debug(`${NAME$p}: Complete.`);
  });
}
/**
 * Welds a {@link Primitive}, merging bitwise identical vertices. When merged
 * and indexed, data is shared more efficiently between vertices. File size can
 * be reduced, and the GPU uses the vertex cache more efficiently.
 *
 * Example:
 *
 * ```javascript
 * import { weldPrimitive, getMeshVertexCount, VertexCountMethod } from '@gltf-transform/functions';
 *
 * const mesh = document.getRoot().listMeshes()
 * 	.find((mesh) => mesh.getName() === 'Gizmo');
 *
 * const srcVertexCount = getMeshVertexCount(mesh, VertexCountMethod.UPLOAD);
 *
 * for (const prim of mesh.listPrimitives()) {
 *   weldPrimitive(prim);
 * }
 *
 * const dstVertexCount = getMeshVertexCount(mesh, VertexCountMethod.UPLOAD);
 * ```
 */
function weldPrimitive(prim, _options = WELD_DEFAULTS) {
  const graph = prim.getGraph();
  const document = Document.fromGraph(graph);
  const logger = document.getLogger();
  const options = _extends({}, WELD_DEFAULTS, _options);
  if (prim.getIndices() && !options.overwrite) return;
  if (prim.getMode() === Primitive.Mode.POINTS) return;
  const srcVertexCount = prim.getAttribute('POSITION').getCount();
  const srcIndices = prim.getIndices();
  const srcIndicesArray = srcIndices == null ? void 0 : srcIndices.getArray();
  const srcIndicesCount = srcIndices ? srcIndices.getCount() : srcVertexCount;
  const stream = new VertexStream(prim);
  const tableSize = ceilPowerOfTwo$1(srcVertexCount + srcVertexCount / 4);
  const table = new Uint32Array(tableSize).fill(EMPTY_U32$1);
  const writeMap = new Uint32Array(srcVertexCount).fill(EMPTY_U32$1); // oldIndex → newIndex
  // (1) Compare and identify indices to weld.
  let dstVertexCount = 0;
  for (let i = 0; i < srcIndicesCount; i++) {
    const srcIndex = srcIndicesArray ? srcIndicesArray[i] : i;
    if (writeMap[srcIndex] !== EMPTY_U32$1) continue;
    const hashIndex = hashLookup(table, tableSize, stream, srcIndex, EMPTY_U32$1);
    const dstIndex = table[hashIndex];
    if (dstIndex === EMPTY_U32$1) {
      table[hashIndex] = srcIndex;
      writeMap[srcIndex] = dstVertexCount++;
    } else {
      writeMap[srcIndex] = writeMap[dstIndex];
    }
  }
  logger.debug(`${NAME$p}: ${formatDeltaOp(srcVertexCount, dstVertexCount)} vertices.`);
  compactPrimitive(prim, writeMap, dstVertexCount);
}
