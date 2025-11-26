/* esm.sh - @gltf-transform/extensions@4.2.1 */
import { ExtensionProperty as R, PropertyType as h, RefMap as wt, Extension as E, BufferUtils as w, WriterContext as nt, Primitive as rt, Root as bt, AnimationSampler as Ft, AnimationChannel as jt, Accessor as m, MathUtils as he, GLB_BUFFER as yt, ImageUtils as ft, getBounds as Lt, TextureInfo as A, TextureChannel as Q, RefSet as St } from "@gltf-transform/core";
import { read as tt, KHR_DF_MODEL_ETC1S as kt, KHR_DF_MODEL_UASTC as Bt } from "ktx-parse";
var L = "EXT_mesh_gpu_instancing", y = "EXT_meshopt_compression", ne = "EXT_texture_webp", re = "EXT_texture_avif", I = "KHR_draco_mesh_compression", M = "KHR_lights_punctual", k = "KHR_materials_anisotropy", B = "KHR_materials_clearcoat", G = "KHR_materials_diffuse_transmission", U = "KHR_materials_dispersion", v = "KHR_materials_emissive_strength", P = "KHR_materials_ior", V = "KHR_materials_iridescence", H = "KHR_materials_pbrSpecularGlossiness", X = "KHR_materials_sheen", $ = "KHR_materials_specular", z = "KHR_materials_transmission", J = "KHR_materials_unlit", K = "KHR_materials_volume", S = "KHR_materials_variants", At = "KHR_mesh_quantization", oe = "KHR_texture_basisu", q = "KHR_texture_transform", C = "KHR_xmp_json_ld", ot = "INSTANCE_ATTRIBUTE", pe = class extends R {
    init() { this.extensionName = L, this.propertyType = "InstancedMesh", this.parentTypes = [h.NODE] }
    getDefaults() { return Object.assign(super.getDefaults(), { attributes: new wt }) }
    getAttribute(e) { return this.getRefMap("attributes", e) }
    setAttribute(e, n) { return this.setRefMap("attributes", e, n, { usage: ot }) }
    listAttributes() { return this.listRefMapValues("attributes") }
    listSemantics() { return this.listRefMapKeys("attributes") }
};
pe.EXTENSION_NAME = L;
var Te = class extends E {
    constructor(...e) { super(...e), this.extensionName = L, this.provideTypes = [h.NODE], this.prewriteTypes = [h.ACCESSOR] }
    createInstancedMesh() { return new pe(this.document.getGraph()) }
    read(e) {
        return (e.jsonDoc.json.nodes || []).forEach((t, r) => {
            if (!t.extensions || !t.extensions[L]) return;
            let s = t.extensions[L],
                i = this.createInstancedMesh();
            for (let c in s.attributes) i.setAttribute(c, e.accessors[s.attributes[c]]);
            e.nodes[r].setExtension(L, i)
        }), this
    }
    prewrite(e) { e.accessorUsageGroupedByParent.add(ot); for (let n of this.properties) for (let o of n.listAttributes()) e.addAccessorToUsageGroup(o, ot); return this }
    write(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listNodes().forEach(o => {
            let t = o.getExtension(L);
            if (t) {
                let r = e.nodeIndexMap.get(o),
                    s = n.json.nodes[r],
                    i = { attributes: {} };
                t.listSemantics().forEach(c => {
                    let u = t.getAttribute(c);
                    i.attributes[c] = e.accessorIndexMap.get(u)
                }), s.extensions = s.extensions || {}, s.extensions[L] = i
            }
        }), this
    }
};
Te.EXTENSION_NAME = L;

function Y() { return Y = Object.assign ? Object.assign.bind() : function(a) { for (var e = 1; e < arguments.length; e++) { var n = arguments[e]; for (var o in n)({}).hasOwnProperty.call(n, o) && (a[o] = n[o]) } return a }, Y.apply(null, arguments) }
var ie;
(function(a) { a.QUANTIZE = "quantize", a.FILTER = "filter" })(ie || (ie = {}));
var ee;
(function(a) { a.ATTRIBUTES = "ATTRIBUTES", a.TRIANGLES = "TRIANGLES", a.INDICES = "INDICES" })(ee || (ee = {}));
var N;
(function(a) { a.NONE = "NONE", a.OCTAHEDRAL = "OCTAHEDRAL", a.QUATERNION = "QUATERNION", a.EXPONENTIAL = "EXPONENTIAL" })(N || (N = {}));

function Gt(a) { return !a.extensions || !a.extensions[y] ? !1 : !!a.extensions[y].fallback }
var { BYTE: Ut, SHORT: ht, FLOAT: vt } = m.ComponentType, { encodeNormalizedInt: dt, decodeNormalizedInt: it } = he;

function Pt(a, e, n, o) {
    let { filter: t, bits: r } = o, s = { array: a.getArray(), byteStride: a.getElementSize() * a.getComponentSize(), componentType: a.getComponentType(), normalized: a.getNormalized() };
    if (n !== ee.ATTRIBUTES) return s;
    if (t !== N.NONE) {
        let i = a.getNormalized() ? Vt(a) : new Float32Array(s.array);
        switch (t) {
            case N.EXPONENTIAL:
                s.byteStride = a.getElementSize() * 4, s.componentType = vt, s.normalized = !1, s.array = e.encodeFilterExp(i, a.getCount(), s.byteStride, r);
                break;
            case N.OCTAHEDRAL:
                s.byteStride = r > 8 ? 8 : 4, s.componentType = r > 8 ? ht : Ut, s.normalized = !0, i = a.getElementSize() === 3 ? Xt(i) : i, s.array = e.encodeFilterOct(i, a.getCount(), s.byteStride, r);
                break;
            case N.QUATERNION:
                s.byteStride = 8, s.componentType = ht, s.normalized = !0, s.array = e.encodeFilterQuat(i, a.getCount(), s.byteStride, r);
                break;
            default:
                throw new Error("Invalid filter.")
        }
        s.min = a.getMin([]), s.max = a.getMax([]), a.getNormalized() && (s.min = s.min.map(c => it(c, a.getComponentType())), s.max = s.max.map(c => it(c, a.getComponentType()))), s.normalized && (s.min = s.min.map(c => dt(c, s.componentType)), s.max = s.max.map(c => dt(c, s.componentType)))
    } else s.byteStride % 4 && (s.array = Ht(s.array, a.getElementSize()), s.byteStride = s.array.byteLength / a.getCount());
    return s
}

function Vt(a) {
    let e = a.getComponentType(),
        n = a.getArray(),
        o = new Float32Array(n.length);
    for (let t = 0; t < n.length; t++) o[t] = it(n[t], e);
    return o
}

function Ht(a, e) {
    let o = w.padNumber(a.BYTES_PER_ELEMENT * e) / a.BYTES_PER_ELEMENT,
        t = a.length / e,
        r = new a.constructor(t * o);
    for (let s = 0; s * e < a.length; s++)
        for (let i = 0; i < e; i++) r[s * o + i] = a[s * e + i];
    return r
}

function Xt(a) {
    let e = new Float32Array(a.length * 4 / 3);
    for (let n = 0, o = a.length / 3; n < o; n++) e[n * 4] = a[n * 3], e[n * 4 + 1] = a[n * 3 + 1], e[n * 4 + 2] = a[n * 3 + 2];
    return e
}

function $t(a, e) { return e === nt.BufferViewUsage.ELEMENT_ARRAY_BUFFER ? a.listParents().some(o => o instanceof rt && o.getMode() === rt.Mode.TRIANGLES) ? ee.TRIANGLES : ee.INDICES : ee.ATTRIBUTES }

function zt(a, e) {
    let n = e.getGraph().listParentEdges(a).filter(o => !(o.getParent() instanceof bt));
    for (let o of n) {
        let t = o.getName(),
            r = o.getAttributes().key || "",
            s = o.getParent().propertyType === h.PRIMITIVE_TARGET;
        if (t === "indices") return { filter: N.NONE };
        if (t === "attributes") { if (r === "POSITION") return { filter: N.NONE }; if (r === "TEXCOORD_0") return { filter: N.NONE }; if (r.startsWith("JOINTS_")) return { filter: N.NONE }; if (r.startsWith("WEIGHTS_")) return { filter: N.NONE }; if (r === "NORMAL" || r === "TANGENT") return s ? { filter: N.NONE } : { filter: N.OCTAHEDRAL, bits: 8 } }
        if (t === "output") { let i = _t(a); return i === "rotation" ? { filter: N.QUATERNION, bits: 16 } : i === "translation" ? { filter: N.EXPONENTIAL, bits: 12 } : i === "scale" ? { filter: N.EXPONENTIAL, bits: 12 } : { filter: N.NONE } }
        if (t === "input") return { filter: N.NONE };
        if (t === "inverseBindMatrices") return { filter: N.NONE }
    }
    return { filter: N.NONE }
}

function _t(a) { for (let e of a.listParents()) if (e instanceof Ft) for (let n of e.listParents()) if (n instanceof jt) return n.getTargetPath(); return null }
var pt = { method: ie.QUANTIZE },
    ce = class extends E {
        constructor(...e) { super(...e), this.extensionName = y, this.prereadTypes = [h.BUFFER, h.PRIMITIVE], this.prewriteTypes = [h.BUFFER, h.ACCESSOR], this.readDependencies = ["meshopt.decoder"], this.writeDependencies = ["meshopt.encoder"], this._decoder = null, this._decoderFallbackBufferMap = new Map, this._encoder = null, this._encoderOptions = pt, this._encoderFallbackBuffer = null, this._encoderBufferViews = {}, this._encoderBufferViewData = {}, this._encoderBufferViewAccessors = {} }
        install(e, n) { return e === "meshopt.decoder" && (this._decoder = n), e === "meshopt.encoder" && (this._encoder = n), this }
        setEncoderOptions(e) { return this._encoderOptions = Y({}, pt, e), this }
        preread(e, n) {
            if (!this._decoder) { if (!this.isRequired()) return this; throw new Error(`[${y}] Please install extension dependency, "meshopt.decoder".`) }
            if (!this._decoder.supported) { if (!this.isRequired()) return this; throw new Error(`[${y}]: Missing WASM support.`) }
            return n === h.BUFFER ? this._prereadBuffers(e) : n === h.PRIMITIVE && this._prereadPrimitives(e), this
        }
        _prereadBuffers(e) {
            let n = e.jsonDoc;
            (n.json.bufferViews || []).forEach((t, r) => {
                if (!t.extensions || !t.extensions[y]) return;
                let s = t.extensions[y],
                    i = s.byteOffset || 0,
                    c = s.byteLength || 0,
                    u = s.count,
                    l = s.byteStride,
                    f = new Uint8Array(u * l),
                    d = n.json.buffers[s.buffer],
                    p = d.uri ? n.resources[d.uri] : n.resources[yt],
                    T = w.toView(p, i, c);
                this._decoder.decodeGltfBuffer(f, u, l, T, s.mode, s.filter), e.bufferViews[r] = f
            })
        }
        _prereadPrimitives(e) {
            let n = e.jsonDoc;
            (n.json.bufferViews || []).forEach(t => {
                if (!t.extensions || !t.extensions[y]) return;
                let r = t.extensions[y],
                    s = e.buffers[r.buffer],
                    i = e.buffers[t.buffer],
                    c = n.json.buffers[t.buffer];
                Gt(c) && this._decoderFallbackBufferMap.set(i, s)
            })
        }
        read(e) {
            if (!this.isRequired()) return this;
            for (let [n, o] of this._decoderFallbackBufferMap) {
                for (let t of n.listParents()) t instanceof m && t.swap(n, o);
                n.dispose()
            }
            return this
        }
        prewrite(e, n) { return n === h.ACCESSOR ? this._prewriteAccessors(e) : n === h.BUFFER && this._prewriteBuffers(e), this }
        _prewriteAccessors(e) {
            let n = e.jsonDoc.json,
                o = this._encoder,
                t = this._encoderOptions,
                r = this.document.getGraph(),
                s = this.document.createBuffer(),
                i = this.document.getRoot().listBuffers().indexOf(s),
                c = 1,
                u = new Map,
                l = f => { for (let d of r.listParents(f)) { if (d.propertyType === h.ROOT) continue; let p = u.get(f); return p === void 0 && u.set(f, p = c++), p } return -1 };
            this._encoderFallbackBuffer = s, this._encoderBufferViews = {}, this._encoderBufferViewData = {}, this._encoderBufferViewAccessors = {};
            for (let f of this.document.getRoot().listAccessors()) {
                if (_t(f) === "weights" || f.getSparse()) continue;
                let d = e.getAccessorUsage(f),
                    p = e.accessorUsageGroupedByParent.has(d) ? l(f) : null,
                    T = $t(f, d),
                    g = t.method === ie.FILTER ? zt(f, this.document) : { filter: N.NONE },
                    x = Pt(f, o, T, g),
                    { array: b, byteStride: W } = x,
                    F = f.getBuffer();
                if (!F) throw new Error(`${y}: Missing buffer for accessor.`);
                let de = this.document.getRoot().listBuffers().indexOf(F),
                    Z = [d, p, T, g.filter, W, de].join(":"),
                    se = this._encoderBufferViews[Z],
                    et = this._encoderBufferViewData[Z],
                    lt = this._encoderBufferViewAccessors[Z];
                (!se || !et) && (lt = this._encoderBufferViewAccessors[Z] = [], et = this._encoderBufferViewData[Z] = [], se = this._encoderBufferViews[Z] = { buffer: i, target: nt.USAGE_TO_TARGET[d], byteOffset: 0, byteLength: 0, byteStride: d === nt.BufferViewUsage.ARRAY_BUFFER ? W : void 0, extensions: {
                        [y]: { buffer: de, byteOffset: 0, byteLength: 0, mode: T, filter: g.filter !== N.NONE ? g.filter : void 0, byteStride: W, count: 0 } } });
                let j = e.createAccessorDef(f);
                j.componentType = x.componentType, j.normalized = x.normalized, j.byteOffset = se.byteLength, j.min && x.min && (j.min = x.min), j.max && x.max && (j.max = x.max), e.accessorIndexMap.set(f, n.accessors.length), n.accessors.push(j), lt.push(j), et.push(new Uint8Array(b.buffer, b.byteOffset, b.byteLength)), se.byteLength += b.byteLength, se.extensions.EXT_meshopt_compression.count += f.getCount()
            }
        }
        _prewriteBuffers(e) {
            let n = this._encoder;
            for (let o in this._encoderBufferViews) {
                let t = this._encoderBufferViews[o],
                    r = this._encoderBufferViewData[o],
                    s = this.document.getRoot().listBuffers()[t.extensions[y].buffer],
                    i = e.otherBufferViews.get(s) || [],
                    { count: c, byteStride: u, mode: l } = t.extensions[y],
                    f = w.concat(r),
                    d = n.encodeGltfBuffer(f, c, u, l),
                    p = w.pad(d);
                t.extensions[y].byteLength = d.byteLength, r.length = 0, r.push(p), i.push(p), e.otherBufferViews.set(s, i)
            }
        }
        write(e) {
            let n = 0;
            for (let s in this._encoderBufferViews) {
                let i = this._encoderBufferViews[s],
                    c = this._encoderBufferViewData[s][0],
                    u = e.otherBufferViewsIndexMap.get(c),
                    l = this._encoderBufferViewAccessors[s];
                for (let T of l) T.bufferView = u;
                let f = e.jsonDoc.json.bufferViews[u],
                    d = f.byteOffset || 0;
                Object.assign(f, i), f.byteOffset = n;
                let p = f.extensions[y];
                p.byteOffset = d, n += w.padNumber(i.byteLength)
            }
            let o = this._encoderFallbackBuffer,
                t = e.bufferIndexMap.get(o),
                r = e.jsonDoc.json.buffers[t];
            return r.byteLength = n, r.extensions = {
                [y]: { fallback: !0 } }, o.dispose(), this
        }
    };
ce.EXTENSION_NAME = y;
ce.EncoderMethod = ie;
var ct = class {
        match(e) { return e.length >= 12 && w.decodeText(e.slice(4, 12)) === "ftypavif" }
        getSize(e) {
            if (!this.match(e)) return null;
            let n = new DataView(e.buffer, e.byteOffset, e.byteLength),
                o = Tt(n, 0);
            if (!o) return null;
            let t = o.end;
            for (; o = Tt(n, t);) { if (o.type === "meta") t = o.start + 4;
                else if (o.type === "iprp" || o.type === "ipco") t = o.start;
                else { if (o.type === "ispe") return [n.getUint32(o.start + 4), n.getUint32(o.start + 8)]; if (o.type === "mdat") break;
                    t = o.end } }
            return null
        }
        getChannels(e) { return 4 }
    },
    ge = class extends E {
        constructor(...e) { super(...e), this.extensionName = re, this.prereadTypes = [h.TEXTURE] }
        static register() { ft.registerFormat("image/avif", new ct) }
        preread(e) { return (e.jsonDoc.json.textures || []).forEach(o => { o.extensions && o.extensions[re] && (o.source = o.extensions[re].source) }), this }
        read(e) { return this }
        write(e) {
            let n = e.jsonDoc;
            return this.document.getRoot().listTextures().forEach(o => {
                if (o.getMimeType() === "image/avif") {
                    let t = e.imageIndexMap.get(o);
                    (n.json.textures || []).forEach(s => { s.source === t && (s.extensions = s.extensions || {}, s.extensions[re] = { source: s.source }, delete s.source) })
                }
            }), this
        }
    };
ge.EXTENSION_NAME = re;

function Tt(a, e) { if (a.byteLength < 4 + e) return null; let n = a.getUint32(e); return a.byteLength < n + e || n < 8 ? null : { type: w.decodeText(new Uint8Array(a.buffer, a.byteOffset + e + 4, 4)), start: e + 8, end: e + n } }
var at = class {
        match(e) { return e.length >= 12 && e[8] === 87 && e[9] === 69 && e[10] === 66 && e[11] === 80 }
        getSize(e) {
            let n = w.decodeText(e.slice(0, 4)),
                o = w.decodeText(e.slice(8, 12));
            if (n !== "RIFF" || o !== "WEBP") return null;
            let t = new DataView(e.buffer, e.byteOffset),
                r = 12;
            for (; r < t.byteLength;) {
                let s = w.decodeText(new Uint8Array([t.getUint8(r), t.getUint8(r + 1), t.getUint8(r + 2), t.getUint8(r + 3)])),
                    i = t.getUint32(r + 4, !0);
                if (s === "VP8 ") { let c = t.getInt16(r + 14, !0) & 16383,
                        u = t.getInt16(r + 16, !0) & 16383; return [c, u] } else if (s === "VP8L") {
                    let c = t.getUint8(r + 9),
                        u = t.getUint8(r + 10),
                        l = t.getUint8(r + 11),
                        f = t.getUint8(r + 12),
                        d = 1 + ((u & 63) << 8 | c),
                        p = 1 + ((f & 15) << 10 | l << 2 | (u & 192) >> 6);
                    return [d, p]
                }
                r += 8 + i + i % 2
            }
            return null
        }
        getChannels(e) { return 4 }
    },
    xe = class extends E {
        constructor(...e) { super(...e), this.extensionName = ne, this.prereadTypes = [h.TEXTURE] }
        static register() { ft.registerFormat("image/webp", new at) }
        preread(e) { return (e.jsonDoc.json.textures || []).forEach(o => { o.extensions && o.extensions[ne] && (o.source = o.extensions[ne].source) }), this }
        read(e) { return this }
        write(e) {
            let n = e.jsonDoc;
            return this.document.getRoot().listTextures().forEach(o => {
                if (o.getMimeType() === "image/webp") {
                    let t = e.imageIndexMap.get(o);
                    (n.json.textures || []).forEach(s => { s.source === t && (s.extensions = s.extensions || {}, s.extensions[ne] = { source: s.source }, delete s.source) })
                }
            }), this
        }
    };
xe.EXTENSION_NAME = ne;
var D, Mt, Ct;

function Kt(a, e) {
    let n = new D.DecoderBuffer;
    try { if (n.Init(e, e.length), a.GetEncodedGeometryType(n) !== D.TRIANGULAR_MESH) throw new Error(`[${I}] Unknown geometry type.`); let t = new D.Mesh; if (!a.DecodeBufferToMesh(n, t).ok() || t.ptr === 0) throw new Error(`[${I}] Decoding failure.`); return t } finally { D.destroy(n) }
}

function qt(a, e) {
    let o = e.num_faces() * 3,
        t, r;
    if (e.num_points() <= 65534) { let s = o * Uint16Array.BYTES_PER_ELEMENT;
        t = D._malloc(s), a.GetTrianglesUInt16Array(e, s, t), r = new Uint16Array(D.HEAPU16.buffer, t, o).slice() } else { let s = o * Uint32Array.BYTES_PER_ELEMENT;
        t = D._malloc(s), a.GetTrianglesUInt32Array(e, s, t), r = new Uint32Array(D.HEAPU32.buffer, t, o).slice() }
    return D._free(t), r
}

function Yt(a, e, n, o) {
    let t = Ct[o.componentType],
        r = Mt[o.componentType],
        s = n.num_components(),
        c = e.num_points() * s,
        u = c * r.BYTES_PER_ELEMENT,
        l = D._malloc(u);
    a.GetAttributeDataArrayForAllPoints(e, n, t, u, l);
    let f = new r(D.HEAPF32.buffer, l, c).slice();
    return D._free(l), f
}

function Qt(a) { D = a, Mt = {
        [m.ComponentType.FLOAT]: Float32Array, [m.ComponentType.UNSIGNED_INT]: Uint32Array, [m.ComponentType.UNSIGNED_SHORT]: Uint16Array, [m.ComponentType.UNSIGNED_BYTE]: Uint8Array, [m.ComponentType.SHORT]: Int16Array, [m.ComponentType.BYTE]: Int8Array }, Ct = {
        [m.ComponentType.FLOAT]: D.DT_FLOAT32, [m.ComponentType.UNSIGNED_INT]: D.DT_UINT32, [m.ComponentType.UNSIGNED_SHORT]: D.DT_UINT16, [m.ComponentType.UNSIGNED_BYTE]: D.DT_UINT8, [m.ComponentType.SHORT]: D.DT_INT16, [m.ComponentType.BYTE]: D.DT_INT8 } }
var _, ae;
(function(a) { a[a.EDGEBREAKER = 1] = "EDGEBREAKER", a[a.SEQUENTIAL = 0] = "SEQUENTIAL" })(ae || (ae = {}));
var O;
(function(a) { a.POSITION = "POSITION", a.NORMAL = "NORMAL", a.COLOR = "COLOR", a.TEX_COORD = "TEX_COORD", a.GENERIC = "GENERIC" })(O || (O = {}));
var Ot = {
        [O.POSITION]: 14,
        [O.NORMAL]: 10,
        [O.COLOR]: 8,
        [O.TEX_COORD]: 12,
        [O.GENERIC]: 12 },
    gt = { decodeSpeed: 5, encodeSpeed: 5, method: ae.EDGEBREAKER, quantizationBits: Ot, quantizationVolume: "mesh" };

function Wt(a) { _ = a }

function Jt(a, e = gt) {
    let n = Y({}, gt, e);
    n.quantizationBits = Y({}, Ot, e.quantizationBits);
    let o = new _.MeshBuilder,
        t = new _.Mesh,
        r = new _.ExpertEncoder(t),
        s = {},
        i = new _.DracoInt8Array,
        c = a.listTargets().length > 0,
        u = !1;
    for (let g of a.listSemantics()) {
        let x = a.getAttribute(g);
        if (x.getSparse()) { u = !0; continue }
        let b = Zt(g),
            W = es(o, x.getComponentType(), t, _[b], x.getCount(), x.getElementSize(), x.getArray());
        if (W === -1) throw new Error(`Error compressing "${g}" attribute.`);
        if (s[g] = W, n.quantizationVolume === "mesh" || g !== "POSITION") r.SetAttributeQuantization(W, n.quantizationBits[b]);
        else if (typeof n.quantizationVolume == "object") { let { quantizationVolume: F } = n, de = Math.max(F.max[0] - F.min[0], F.max[1] - F.min[1], F.max[2] - F.min[2]);
            r.SetAttributeExplicitQuantization(W, n.quantizationBits[b], x.getElementSize(), F.min, de) } else throw new Error("Invalid quantization volume state.")
    }
    let l = a.getIndices();
    if (!l) throw new ue("Primitive must have indices.");
    o.AddFacesToMesh(t, l.getCount() / 3, l.getArray()), r.SetSpeedOptions(n.encodeSpeed, n.decodeSpeed), r.SetTrackEncodedProperties(!0), n.method === ae.SEQUENTIAL || c || u ? r.SetEncodingMethod(_.MESH_SEQUENTIAL_ENCODING) : r.SetEncodingMethod(_.MESH_EDGEBREAKER_ENCODING);
    let f = r.EncodeToDracoBuffer(!(c || u), i);
    if (f <= 0) throw new ue("Error applying Draco compression.");
    let d = new Uint8Array(f);
    for (let g = 0; g < f; ++g) d[g] = i.GetValue(g);
    let p = r.GetNumberOfEncodedPoints(),
        T = r.GetNumberOfEncodedFaces() * 3;
    return _.destroy(i), _.destroy(t), _.destroy(o), _.destroy(r), { numVertices: p, numIndices: T, data: d, attributeIDs: s }
}

function Zt(a) { return a === "POSITION" ? O.POSITION : a === "NORMAL" ? O.NORMAL : a.startsWith("COLOR_") ? O.COLOR : a.startsWith("TEXCOORD_") ? O.TEX_COORD : O.GENERIC }

function es(a, e, n, o, t, r, s) { switch (e) {
        case m.ComponentType.UNSIGNED_BYTE:
            return a.AddUInt8Attribute(n, o, t, r, s);
        case m.ComponentType.BYTE:
            return a.AddInt8Attribute(n, o, t, r, s);
        case m.ComponentType.UNSIGNED_SHORT:
            return a.AddUInt16Attribute(n, o, t, r, s);
        case m.ComponentType.SHORT:
            return a.AddInt16Attribute(n, o, t, r, s);
        case m.ComponentType.UNSIGNED_INT:
            return a.AddUInt32Attribute(n, o, t, r, s);
        case m.ComponentType.FLOAT:
            return a.AddFloatAttribute(n, o, t, r, s);
        default:
            throw new Error(`Unexpected component type, "${e}".`) } }
var ue = class extends Error {},
    fe = class extends E {
        constructor(...e) { super(...e), this.extensionName = I, this.prereadTypes = [h.PRIMITIVE], this.prewriteTypes = [h.ACCESSOR], this.readDependencies = ["draco3d.decoder"], this.writeDependencies = ["draco3d.encoder"], this._decoderModule = null, this._encoderModule = null, this._encoderOptions = {} }
        install(e, n) { return e === "draco3d.decoder" && (this._decoderModule = n, Qt(this._decoderModule)), e === "draco3d.encoder" && (this._encoderModule = n, Wt(this._encoderModule)), this }
        setEncoderOptions(e) { return this._encoderOptions = e, this }
        preread(e) {
            if (!this._decoderModule) throw new Error(`[${I}] Please install extension dependency, "draco3d.decoder".`);
            let n = this.document.getLogger(),
                o = e.jsonDoc,
                t = new Map;
            try {
                let r = o.json.meshes || [];
                for (let s of r)
                    for (let i of s.primitives) {
                        if (!i.extensions || !i.extensions[I]) continue;
                        let c = i.extensions[I],
                            [u, l] = t.get(c.bufferView) || [];
                        if (!l || !u) {
                            let f = o.json.bufferViews[c.bufferView],
                                d = o.json.buffers[f.buffer],
                                p = d.uri ? o.resources[d.uri] : o.resources[yt],
                                T = f.byteOffset || 0,
                                g = f.byteLength,
                                x = w.toView(p, T, g);
                            u = new this._decoderModule.Decoder, l = Kt(u, x), t.set(c.bufferView, [u, l]), n.debug(`[${I}] Decompressed ${x.byteLength} bytes.`)
                        }
                        for (let f in c.attributes) { let d = e.jsonDoc.json.accessors[i.attributes[f]],
                                p = u.GetAttributeByUniqueId(l, c.attributes[f]),
                                T = Yt(u, l, p, d);
                            e.accessors[i.attributes[f]].setArray(T) }
                        i.indices !== void 0 && e.accessors[i.indices].setArray(qt(u, l))
                    }
            } finally { for (let [r, s] of Array.from(t.values())) this._decoderModule.destroy(r), this._decoderModule.destroy(s) }
            return this
        }
        read(e) { return this }
        prewrite(e, n) {
            if (!this._encoderModule) throw new Error(`[${I}] Please install extension dependency, "draco3d.encoder".`);
            let o = this.document.getLogger();
            o.debug(`[${I}] Compression options: ${JSON.stringify(this._encoderOptions)}`);
            let t = ts(this.document),
                r = new Map,
                s = "mesh";
            this._encoderOptions.quantizationVolume === "scene" && (this.document.getRoot().listScenes().length !== 1 ? o.warn(`[${I}]: quantizationVolume=scene requires exactly 1 scene.`) : s = Lt(this.document.getRoot().listScenes().pop()));
            for (let i of Array.from(t.keys())) {
                let c = t.get(i);
                if (!c) throw new Error("Unexpected primitive.");
                if (r.has(c)) { r.set(c, r.get(c)); continue }
                let u = i.getIndices(),
                    l = e.jsonDoc.json.accessors,
                    f;
                try { f = Jt(i, Y({}, this._encoderOptions, { quantizationVolume: s })) } catch (T) { if (T instanceof ue) { o.warn(`[${I}]: ${T.message} Skipping primitive compression.`); continue } throw T }
                r.set(c, f);
                let d = e.createAccessorDef(u);
                d.count = f.numIndices, e.accessorIndexMap.set(u, l.length), l.push(d), f.numVertices > 65534 && m.getComponentSize(d.componentType) <= 2 ? d.componentType = m.ComponentType.UNSIGNED_INT : f.numVertices > 254 && m.getComponentSize(d.componentType) <= 1 && (d.componentType = m.ComponentType.UNSIGNED_SHORT);
                for (let T of i.listSemantics()) { let g = i.getAttribute(T); if (f.attributeIDs[T] === void 0) continue; let x = e.createAccessorDef(g);
                    x.count = f.numVertices, e.accessorIndexMap.set(g, l.length), l.push(x) }
                let p = i.getAttribute("POSITION").getBuffer() || this.document.getRoot().listBuffers()[0];
                e.otherBufferViews.has(p) || e.otherBufferViews.set(p, []), e.otherBufferViews.get(p).push(f.data)
            }
            return o.debug(`[${I}] Compressed ${t.size} primitives.`), e.extensionData[I] = { primitiveHashMap: t, primitiveEncodingMap: r }, this
        }
        write(e) {
            let n = e.extensionData[I];
            for (let o of this.document.getRoot().listMeshes()) {
                let t = e.jsonDoc.json.meshes[e.meshIndexMap.get(o)];
                for (let r = 0; r < o.listPrimitives().length; r++) {
                    let s = o.listPrimitives()[r],
                        i = t.primitives[r],
                        c = n.primitiveHashMap.get(s);
                    if (!c) continue;
                    let u = n.primitiveEncodingMap.get(c);
                    u && (i.extensions = i.extensions || {}, i.extensions[I] = { bufferView: e.otherBufferViewsIndexMap.get(u.data), attributes: u.attributeIDs })
                }
            }
            if (!n.primitiveHashMap.size) { let o = e.jsonDoc.json;
                o.extensionsUsed = (o.extensionsUsed || []).filter(t => t !== I), o.extensionsRequired = (o.extensionsRequired || []).filter(t => t !== I) }
            return this
        }
    };
fe.EXTENSION_NAME = I;
fe.EncoderMethod = ae;

function ts(a) {
    let e = a.getLogger(),
        n = new Set,
        o = new Set,
        t = 0,
        r = 0;
    for (let f of a.getRoot().listMeshes())
        for (let d of f.listPrimitives()) d.getIndices() ? d.getMode() !== rt.Mode.TRIANGLES ? (o.add(d), r++) : n.add(d) : (o.add(d), t++);
    t > 0 && e.warn(`[${I}] Skipping Draco compression of ${t} non-indexed primitives.`), r > 0 && e.warn(`[${I}] Skipping Draco compression of ${r} non-TRIANGLES primitives.`);
    let s = a.getRoot().listAccessors(),
        i = new Map;
    for (let f = 0; f < s.length; f++) i.set(s[f], f);
    let c = new Map,
        u = new Set,
        l = new Map;
    for (let f of Array.from(n)) {
        let d = xt(f, i);
        if (u.has(d)) { l.set(f, d); continue }
        if (c.has(f.getIndices())) { let p = f.getIndices(),
                T = p.clone();
            i.set(T, a.getRoot().listAccessors().length - 1), f.swap(p, T) }
        for (let p of f.listAttributes())
            if (c.has(p)) { let T = p.clone();
                i.set(T, a.getRoot().listAccessors().length - 1), f.swap(p, T) }
        d = xt(f, i), u.add(d), l.set(f, d), c.set(f.getIndices(), d);
        for (let p of f.listAttributes()) c.set(p, d)
    }
    for (let f of Array.from(c.keys())) { let d = new Set(f.listParents().map(p => p.propertyType)); if (d.size !== 2 || !d.has(h.PRIMITIVE) || !d.has(h.ROOT)) throw new Error(`[${I}] Compressed accessors must only be used as indices or vertex attributes.`) }
    for (let f of Array.from(n)) { let d = l.get(f),
            p = f.getIndices(); if (c.get(p) !== d || f.listAttributes().some(T => c.get(T) !== d)) throw new Error(`[${I}] Draco primitives must share all, or no, accessors.`) }
    for (let f of Array.from(o)) { let d = f.getIndices(); if (c.has(d) || f.listAttributes().some(p => c.has(p))) throw new Error(`[${I}] Accessor cannot be shared by compressed and uncompressed primitives.`) }
    return l
}

function xt(a, e) {
    let n = [],
        o = a.getIndices();
    n.push(e.get(o));
    for (let t of a.listAttributes()) n.push(e.get(t));
    return n.sort().join("|")
}
var te = class a extends R {
    init() { this.extensionName = M, this.propertyType = "Light", this.parentTypes = [h.NODE] }
    getDefaults() { return Object.assign(super.getDefaults(), { color: [1, 1, 1], intensity: 1, type: a.Type.POINT, range: null, innerConeAngle: 0, outerConeAngle: Math.PI / 4 }) }
    getColor() { return this.get("color") }
    setColor(e) { return this.set("color", e) }
    getIntensity() { return this.get("intensity") }
    setIntensity(e) { return this.set("intensity", e) }
    getType() { return this.get("type") }
    setType(e) { return this.set("type", e) }
    getRange() { return this.get("range") }
    setRange(e) { return this.set("range", e) }
    getInnerConeAngle() { return this.get("innerConeAngle") }
    setInnerConeAngle(e) { return this.set("innerConeAngle", e) }
    getOuterConeAngle() { return this.get("outerConeAngle") }
    setOuterConeAngle(e) { return this.set("outerConeAngle", e) }
};
te.EXTENSION_NAME = M;
te.Type = { POINT: "point", SPOT: "spot", DIRECTIONAL: "directional" };
var me = class extends E {
    constructor(...e) { super(...e), this.extensionName = M }
    createLight(e = "") { return new te(this.document.getGraph(), e) }
    read(e) {
        let n = e.jsonDoc;
        if (!n.json.extensions || !n.json.extensions[M]) return this;
        let r = (n.json.extensions[M].lights || []).map(s => {
            var i, c;
            let u = this.createLight().setName(s.name || "").setType(s.type);
            return s.color !== void 0 && u.setColor(s.color), s.intensity !== void 0 && u.setIntensity(s.intensity), s.range !== void 0 && u.setRange(s.range), ((i = s.spot) == null ? void 0 : i.innerConeAngle) !== void 0 && u.setInnerConeAngle(s.spot.innerConeAngle), ((c = s.spot) == null ? void 0 : c.outerConeAngle) !== void 0 && u.setOuterConeAngle(s.spot.outerConeAngle), u
        });
        return n.json.nodes.forEach((s, i) => {
            if (!s.extensions || !s.extensions[M]) return;
            let c = s.extensions[M];
            e.nodes[i].setExtension(M, r[c.light])
        }), this
    }
    write(e) {
        let n = e.jsonDoc;
        if (this.properties.size === 0) return this;
        let o = [],
            t = new Map;
        for (let r of this.properties) {
            let s = r,
                i = { type: s.getType() };
            he.eq(s.getColor(), [1, 1, 1]) || (i.color = s.getColor()), s.getIntensity() !== 1 && (i.intensity = s.getIntensity()), s.getRange() != null && (i.range = s.getRange()), s.getName() && (i.name = s.getName()), s.getType() === te.Type.SPOT && (i.spot = { innerConeAngle: s.getInnerConeAngle(), outerConeAngle: s.getOuterConeAngle() }), o.push(i), t.set(s, o.length - 1)
        }
        return this.document.getRoot().listNodes().forEach(r => {
            let s = r.getExtension(M);
            if (s) {
                let i = e.nodeIndexMap.get(r),
                    c = n.json.nodes[i];
                c.extensions = c.extensions || {}, c.extensions[M] = { light: t.get(s) }
            }
        }), n.json.extensions = n.json.extensions || {}, n.json.extensions[M] = { lights: o }, this
    }
};
me.EXTENSION_NAME = M;
var { R: ss, G: ns, B: rs } = Q, Ee = class extends R {
    init() { this.extensionName = k, this.propertyType = "Anisotropy", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { anisotropyStrength: 0, anisotropyRotation: 0, anisotropyTexture: null, anisotropyTextureInfo: new A(this.graph, "anisotropyTextureInfo") }) }
    getAnisotropyStrength() { return this.get("anisotropyStrength") }
    setAnisotropyStrength(e) { return this.set("anisotropyStrength", e) }
    getAnisotropyRotation() { return this.get("anisotropyRotation") }
    setAnisotropyRotation(e) { return this.set("anisotropyRotation", e) }
    getAnisotropyTexture() { return this.getRef("anisotropyTexture") }
    getAnisotropyTextureInfo() { return this.getRef("anisotropyTexture") ? this.getRef("anisotropyTextureInfo") : null }
    setAnisotropyTexture(e) { return this.setRef("anisotropyTexture", e, { channels: ss | ns | rs }) }
};
Ee.EXTENSION_NAME = k;
var Ie = class extends E {
    constructor(...e) { super(...e), this.extensionName = k, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createAnisotropy() { return new Ee(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[k]) {
                let i = this.createAnisotropy();
                e.materials[s].setExtension(k, i);
                let c = r.extensions[k];
                if (c.anisotropyStrength !== void 0 && i.setAnisotropyStrength(c.anisotropyStrength), c.anisotropyRotation !== void 0 && i.setAnisotropyRotation(c.anisotropyRotation), c.anisotropyTexture !== void 0) {
                    let u = c.anisotropyTexture,
                        l = e.textures[t[u.index].source];
                    i.setAnisotropyTexture(l), e.setTextureInfo(i.getAnisotropyTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(k);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[k] = {};
                if (t.getAnisotropyStrength() > 0 && (i.anisotropyStrength = t.getAnisotropyStrength()), t.getAnisotropyRotation() !== 0 && (i.anisotropyRotation = t.getAnisotropyRotation()), t.getAnisotropyTexture()) {
                    let c = t.getAnisotropyTexture(),
                        u = t.getAnisotropyTextureInfo();
                    i.anisotropyTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
Ie.EXTENSION_NAME = k;
var { R: mt, G: Et, B: os } = Q, Ne = class extends R {
    init() { this.extensionName = B, this.propertyType = "Clearcoat", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { clearcoatFactor: 0, clearcoatTexture: null, clearcoatTextureInfo: new A(this.graph, "clearcoatTextureInfo"), clearcoatRoughnessFactor: 0, clearcoatRoughnessTexture: null, clearcoatRoughnessTextureInfo: new A(this.graph, "clearcoatRoughnessTextureInfo"), clearcoatNormalScale: 1, clearcoatNormalTexture: null, clearcoatNormalTextureInfo: new A(this.graph, "clearcoatNormalTextureInfo") }) }
    getClearcoatFactor() { return this.get("clearcoatFactor") }
    setClearcoatFactor(e) { return this.set("clearcoatFactor", e) }
    getClearcoatTexture() { return this.getRef("clearcoatTexture") }
    getClearcoatTextureInfo() { return this.getRef("clearcoatTexture") ? this.getRef("clearcoatTextureInfo") : null }
    setClearcoatTexture(e) { return this.setRef("clearcoatTexture", e, { channels: mt }) }
    getClearcoatRoughnessFactor() { return this.get("clearcoatRoughnessFactor") }
    setClearcoatRoughnessFactor(e) { return this.set("clearcoatRoughnessFactor", e) }
    getClearcoatRoughnessTexture() { return this.getRef("clearcoatRoughnessTexture") }
    getClearcoatRoughnessTextureInfo() { return this.getRef("clearcoatRoughnessTexture") ? this.getRef("clearcoatRoughnessTextureInfo") : null }
    setClearcoatRoughnessTexture(e) { return this.setRef("clearcoatRoughnessTexture", e, { channels: Et }) }
    getClearcoatNormalScale() { return this.get("clearcoatNormalScale") }
    setClearcoatNormalScale(e) { return this.set("clearcoatNormalScale", e) }
    getClearcoatNormalTexture() { return this.getRef("clearcoatNormalTexture") }
    getClearcoatNormalTextureInfo() { return this.getRef("clearcoatNormalTexture") ? this.getRef("clearcoatNormalTextureInfo") : null }
    setClearcoatNormalTexture(e) { return this.setRef("clearcoatNormalTexture", e, { channels: mt | Et | os }) }
};
Ne.EXTENSION_NAME = B;
var Re = class extends E {
    constructor(...e) { super(...e), this.extensionName = B, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createClearcoat() { return new Ne(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[B]) {
                let i = this.createClearcoat();
                e.materials[s].setExtension(B, i);
                let c = r.extensions[B];
                if (c.clearcoatFactor !== void 0 && i.setClearcoatFactor(c.clearcoatFactor), c.clearcoatRoughnessFactor !== void 0 && i.setClearcoatRoughnessFactor(c.clearcoatRoughnessFactor), c.clearcoatTexture !== void 0) {
                    let u = c.clearcoatTexture,
                        l = e.textures[t[u.index].source];
                    i.setClearcoatTexture(l), e.setTextureInfo(i.getClearcoatTextureInfo(), u)
                }
                if (c.clearcoatRoughnessTexture !== void 0) {
                    let u = c.clearcoatRoughnessTexture,
                        l = e.textures[t[u.index].source];
                    i.setClearcoatRoughnessTexture(l), e.setTextureInfo(i.getClearcoatRoughnessTextureInfo(), u)
                }
                if (c.clearcoatNormalTexture !== void 0) {
                    let u = c.clearcoatNormalTexture,
                        l = e.textures[t[u.index].source];
                    i.setClearcoatNormalTexture(l), e.setTextureInfo(i.getClearcoatNormalTextureInfo(), u), u.scale !== void 0 && i.setClearcoatNormalScale(u.scale)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(B);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[B] = { clearcoatFactor: t.getClearcoatFactor(), clearcoatRoughnessFactor: t.getClearcoatRoughnessFactor() };
                if (t.getClearcoatTexture()) {
                    let c = t.getClearcoatTexture(),
                        u = t.getClearcoatTextureInfo();
                    i.clearcoatTexture = e.createTextureInfoDef(c, u)
                }
                if (t.getClearcoatRoughnessTexture()) {
                    let c = t.getClearcoatRoughnessTexture(),
                        u = t.getClearcoatRoughnessTextureInfo();
                    i.clearcoatRoughnessTexture = e.createTextureInfoDef(c, u)
                }
                if (t.getClearcoatNormalTexture()) {
                    let c = t.getClearcoatNormalTexture(),
                        u = t.getClearcoatNormalTextureInfo();
                    i.clearcoatNormalTexture = e.createTextureInfoDef(c, u), t.getClearcoatNormalScale() !== 1 && (i.clearcoatNormalTexture.scale = t.getClearcoatNormalScale())
                }
            }
        }), this
    }
};
Re.EXTENSION_NAME = B;
var { R: is, G: cs, B: as, A: us } = Q, De = class extends R {
    init() { this.extensionName = G, this.propertyType = "DiffuseTransmission", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { diffuseTransmissionFactor: 0, diffuseTransmissionTexture: null, diffuseTransmissionTextureInfo: new A(this.graph, "diffuseTransmissionTextureInfo"), diffuseTransmissionColorFactor: [1, 1, 1], diffuseTransmissionColorTexture: null, diffuseTransmissionColorTextureInfo: new A(this.graph, "diffuseTransmissionColorTextureInfo") }) }
    getDiffuseTransmissionFactor() { return this.get("diffuseTransmissionFactor") }
    setDiffuseTransmissionFactor(e) { return this.set("diffuseTransmissionFactor", e) }
    getDiffuseTransmissionTexture() { return this.getRef("diffuseTransmissionTexture") }
    getDiffuseTransmissionTextureInfo() { return this.getRef("diffuseTransmissionTexture") ? this.getRef("diffuseTransmissionTextureInfo") : null }
    setDiffuseTransmissionTexture(e) { return this.setRef("diffuseTransmissionTexture", e, { channels: us }) }
    getDiffuseTransmissionColorFactor() { return this.get("diffuseTransmissionColorFactor") }
    setDiffuseTransmissionColorFactor(e) { return this.set("diffuseTransmissionColorFactor", e) }
    getDiffuseTransmissionColorTexture() { return this.getRef("diffuseTransmissionColorTexture") }
    getDiffuseTransmissionColorTextureInfo() { return this.getRef("diffuseTransmissionColorTexture") ? this.getRef("diffuseTransmissionColorTextureInfo") : null }
    setDiffuseTransmissionColorTexture(e) { return this.setRef("diffuseTransmissionColorTexture", e, { channels: is | cs | as }) }
};
De.EXTENSION_NAME = G;
var ye = class extends E {
    constructor(...e) { super(...e), this.extensionName = G }
    createDiffuseTransmission() { return new De(this.document.getGraph()) }
    read(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[G]) {
                let i = this.createDiffuseTransmission();
                e.materials[s].setExtension(G, i);
                let c = r.extensions[G];
                if (c.diffuseTransmissionFactor !== void 0 && i.setDiffuseTransmissionFactor(c.diffuseTransmissionFactor), c.diffuseTransmissionColorFactor !== void 0 && i.setDiffuseTransmissionColorFactor(c.diffuseTransmissionColorFactor), c.diffuseTransmissionTexture !== void 0) {
                    let u = c.diffuseTransmissionTexture,
                        l = e.textures[t[u.index].source];
                    i.setDiffuseTransmissionTexture(l), e.setTextureInfo(i.getDiffuseTransmissionTextureInfo(), u)
                }
                if (c.diffuseTransmissionColorTexture !== void 0) {
                    let u = c.diffuseTransmissionColorTexture,
                        l = e.textures[t[u.index].source];
                    i.setDiffuseTransmissionColorTexture(l), e.setTextureInfo(i.getDiffuseTransmissionColorTextureInfo(), u)
                }
            }
        }), this
    }
    write(e) {
        let n = e.jsonDoc;
        for (let o of this.document.getRoot().listMaterials()) {
            let t = o.getExtension(G);
            if (!t) continue;
            let r = e.materialIndexMap.get(o),
                s = n.json.materials[r];
            s.extensions = s.extensions || {};
            let i = s.extensions[G] = { diffuseTransmissionFactor: t.getDiffuseTransmissionFactor(), diffuseTransmissionColorFactor: t.getDiffuseTransmissionColorFactor() };
            if (t.getDiffuseTransmissionTexture()) {
                let c = t.getDiffuseTransmissionTexture(),
                    u = t.getDiffuseTransmissionTextureInfo();
                i.diffuseTransmissionTexture = e.createTextureInfoDef(c, u)
            }
            if (t.getDiffuseTransmissionColorTexture()) {
                let c = t.getDiffuseTransmissionColorTexture(),
                    u = t.getDiffuseTransmissionColorTextureInfo();
                i.diffuseTransmissionColorTexture = e.createTextureInfoDef(c, u)
            }
        }
        return this
    }
};
ye.EXTENSION_NAME = G;
var Se = class extends R {
    init() { this.extensionName = U, this.propertyType = "Dispersion", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { dispersion: 0 }) }
    getDispersion() { return this.get("dispersion") }
    setDispersion(e) { return this.set("dispersion", e) }
};
Se.EXTENSION_NAME = U;
var Ae = class extends E {
    constructor(...e) { super(...e), this.extensionName = U, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createDispersion() { return new Se(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) { return (e.jsonDoc.json.materials || []).forEach((t, r) => { if (t.extensions && t.extensions[U]) { let s = this.createDispersion();
                e.materials[r].setExtension(U, s); let i = t.extensions[U];
                i.dispersion !== void 0 && s.setDispersion(i.dispersion) } }), this }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(U);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {}, s.extensions[U] = { dispersion: t.getDispersion() }
            }
        }), this
    }
};
Ae.EXTENSION_NAME = U;
var _e = class extends R {
    init() { this.extensionName = v, this.propertyType = "EmissiveStrength", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { emissiveStrength: 1 }) }
    getEmissiveStrength() { return this.get("emissiveStrength") }
    setEmissiveStrength(e) { return this.set("emissiveStrength", e) }
};
_e.EXTENSION_NAME = v;
var Me = class extends E {
    constructor(...e) { super(...e), this.extensionName = v, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createEmissiveStrength() { return new _e(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) { return (e.jsonDoc.json.materials || []).forEach((t, r) => { if (t.extensions && t.extensions[v]) { let s = this.createEmissiveStrength();
                e.materials[r].setExtension(v, s); let i = t.extensions[v];
                i.emissiveStrength !== void 0 && s.setEmissiveStrength(i.emissiveStrength) } }), this }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(v);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {}, s.extensions[v] = { emissiveStrength: t.getEmissiveStrength() }
            }
        }), this
    }
};
Me.EXTENSION_NAME = v;
var Ce = class extends R {
    init() { this.extensionName = P, this.propertyType = "IOR", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { ior: 1.5 }) }
    getIOR() { return this.get("ior") }
    setIOR(e) { return this.set("ior", e) }
};
Ce.EXTENSION_NAME = P;
var Oe = class extends E {
    constructor(...e) { super(...e), this.extensionName = P, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createIOR() { return new Ce(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) { return (e.jsonDoc.json.materials || []).forEach((t, r) => { if (t.extensions && t.extensions[P]) { let s = this.createIOR();
                e.materials[r].setExtension(P, s); let i = t.extensions[P];
                i.ior !== void 0 && s.setIOR(i.ior) } }), this }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(P);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {}, s.extensions[P] = { ior: t.getIOR() }
            }
        }), this
    }
};
Oe.EXTENSION_NAME = P;
var { R: fs, G: ls } = Q, we = class extends R {
    init() { this.extensionName = V, this.propertyType = "Iridescence", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { iridescenceFactor: 0, iridescenceTexture: null, iridescenceTextureInfo: new A(this.graph, "iridescenceTextureInfo"), iridescenceIOR: 1.3, iridescenceThicknessMinimum: 100, iridescenceThicknessMaximum: 400, iridescenceThicknessTexture: null, iridescenceThicknessTextureInfo: new A(this.graph, "iridescenceThicknessTextureInfo") }) }
    getIridescenceFactor() { return this.get("iridescenceFactor") }
    setIridescenceFactor(e) { return this.set("iridescenceFactor", e) }
    getIridescenceTexture() { return this.getRef("iridescenceTexture") }
    getIridescenceTextureInfo() { return this.getRef("iridescenceTexture") ? this.getRef("iridescenceTextureInfo") : null }
    setIridescenceTexture(e) { return this.setRef("iridescenceTexture", e, { channels: fs }) }
    getIridescenceIOR() { return this.get("iridescenceIOR") }
    setIridescenceIOR(e) { return this.set("iridescenceIOR", e) }
    getIridescenceThicknessMinimum() { return this.get("iridescenceThicknessMinimum") }
    setIridescenceThicknessMinimum(e) { return this.set("iridescenceThicknessMinimum", e) }
    getIridescenceThicknessMaximum() { return this.get("iridescenceThicknessMaximum") }
    setIridescenceThicknessMaximum(e) { return this.set("iridescenceThicknessMaximum", e) }
    getIridescenceThicknessTexture() { return this.getRef("iridescenceThicknessTexture") }
    getIridescenceThicknessTextureInfo() { return this.getRef("iridescenceThicknessTexture") ? this.getRef("iridescenceThicknessTextureInfo") : null }
    setIridescenceThicknessTexture(e) { return this.setRef("iridescenceThicknessTexture", e, { channels: ls }) }
};
we.EXTENSION_NAME = V;
var be = class extends E {
    constructor(...e) { super(...e), this.extensionName = V, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createIridescence() { return new we(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[V]) {
                let i = this.createIridescence();
                e.materials[s].setExtension(V, i);
                let c = r.extensions[V];
                if (c.iridescenceFactor !== void 0 && i.setIridescenceFactor(c.iridescenceFactor), c.iridescenceIor !== void 0 && i.setIridescenceIOR(c.iridescenceIor), c.iridescenceThicknessMinimum !== void 0 && i.setIridescenceThicknessMinimum(c.iridescenceThicknessMinimum), c.iridescenceThicknessMaximum !== void 0 && i.setIridescenceThicknessMaximum(c.iridescenceThicknessMaximum), c.iridescenceTexture !== void 0) {
                    let u = c.iridescenceTexture,
                        l = e.textures[t[u.index].source];
                    i.setIridescenceTexture(l), e.setTextureInfo(i.getIridescenceTextureInfo(), u)
                }
                if (c.iridescenceThicknessTexture !== void 0) {
                    let u = c.iridescenceThicknessTexture,
                        l = e.textures[t[u.index].source];
                    i.setIridescenceThicknessTexture(l), e.setTextureInfo(i.getIridescenceThicknessTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(V);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[V] = {};
                if (t.getIridescenceFactor() > 0 && (i.iridescenceFactor = t.getIridescenceFactor()), t.getIridescenceIOR() !== 1.3 && (i.iridescenceIor = t.getIridescenceIOR()), t.getIridescenceThicknessMinimum() !== 100 && (i.iridescenceThicknessMinimum = t.getIridescenceThicknessMinimum()), t.getIridescenceThicknessMaximum() !== 400 && (i.iridescenceThicknessMaximum = t.getIridescenceThicknessMaximum()), t.getIridescenceTexture()) {
                    let c = t.getIridescenceTexture(),
                        u = t.getIridescenceTextureInfo();
                    i.iridescenceTexture = e.createTextureInfoDef(c, u)
                }
                if (t.getIridescenceThicknessTexture()) {
                    let c = t.getIridescenceThicknessTexture(),
                        u = t.getIridescenceThicknessTextureInfo();
                    i.iridescenceThicknessTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
be.EXTENSION_NAME = V;
var { R: It, G: Nt, B: Rt, A: Dt } = Q, Fe = class extends R {
    init() { this.extensionName = H, this.propertyType = "PBRSpecularGlossiness", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { diffuseFactor: [1, 1, 1, 1], diffuseTexture: null, diffuseTextureInfo: new A(this.graph, "diffuseTextureInfo"), specularFactor: [1, 1, 1], glossinessFactor: 1, specularGlossinessTexture: null, specularGlossinessTextureInfo: new A(this.graph, "specularGlossinessTextureInfo") }) }
    getDiffuseFactor() { return this.get("diffuseFactor") }
    setDiffuseFactor(e) { return this.set("diffuseFactor", e) }
    getDiffuseTexture() { return this.getRef("diffuseTexture") }
    getDiffuseTextureInfo() { return this.getRef("diffuseTexture") ? this.getRef("diffuseTextureInfo") : null }
    setDiffuseTexture(e) { return this.setRef("diffuseTexture", e, { channels: It | Nt | Rt | Dt, isColor: !0 }) }
    getSpecularFactor() { return this.get("specularFactor") }
    setSpecularFactor(e) { return this.set("specularFactor", e) }
    getGlossinessFactor() { return this.get("glossinessFactor") }
    setGlossinessFactor(e) { return this.set("glossinessFactor", e) }
    getSpecularGlossinessTexture() { return this.getRef("specularGlossinessTexture") }
    getSpecularGlossinessTextureInfo() { return this.getRef("specularGlossinessTexture") ? this.getRef("specularGlossinessTextureInfo") : null }
    setSpecularGlossinessTexture(e) { return this.setRef("specularGlossinessTexture", e, { channels: It | Nt | Rt | Dt }) }
};
Fe.EXTENSION_NAME = H;
var je = class extends E {
    constructor(...e) { super(...e), this.extensionName = H, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createPBRSpecularGlossiness() { return new Fe(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[H]) {
                let i = this.createPBRSpecularGlossiness();
                e.materials[s].setExtension(H, i);
                let c = r.extensions[H];
                if (c.diffuseFactor !== void 0 && i.setDiffuseFactor(c.diffuseFactor), c.specularFactor !== void 0 && i.setSpecularFactor(c.specularFactor), c.glossinessFactor !== void 0 && i.setGlossinessFactor(c.glossinessFactor), c.diffuseTexture !== void 0) {
                    let u = c.diffuseTexture,
                        l = e.textures[t[u.index].source];
                    i.setDiffuseTexture(l), e.setTextureInfo(i.getDiffuseTextureInfo(), u)
                }
                if (c.specularGlossinessTexture !== void 0) {
                    let u = c.specularGlossinessTexture,
                        l = e.textures[t[u.index].source];
                    i.setSpecularGlossinessTexture(l), e.setTextureInfo(i.getSpecularGlossinessTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(H);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[H] = { diffuseFactor: t.getDiffuseFactor(), specularFactor: t.getSpecularFactor(), glossinessFactor: t.getGlossinessFactor() };
                if (t.getDiffuseTexture()) {
                    let c = t.getDiffuseTexture(),
                        u = t.getDiffuseTextureInfo();
                    i.diffuseTexture = e.createTextureInfoDef(c, u)
                }
                if (t.getSpecularGlossinessTexture()) {
                    let c = t.getSpecularGlossinessTexture(),
                        u = t.getSpecularGlossinessTextureInfo();
                    i.specularGlossinessTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
je.EXTENSION_NAME = H;
var { R: hs, G: ds, B: ps, A: Ts } = Q, Le = class extends R {
    init() { this.extensionName = X, this.propertyType = "Sheen", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { sheenColorFactor: [0, 0, 0], sheenColorTexture: null, sheenColorTextureInfo: new A(this.graph, "sheenColorTextureInfo"), sheenRoughnessFactor: 0, sheenRoughnessTexture: null, sheenRoughnessTextureInfo: new A(this.graph, "sheenRoughnessTextureInfo") }) }
    getSheenColorFactor() { return this.get("sheenColorFactor") }
    setSheenColorFactor(e) { return this.set("sheenColorFactor", e) }
    getSheenColorTexture() { return this.getRef("sheenColorTexture") }
    getSheenColorTextureInfo() { return this.getRef("sheenColorTexture") ? this.getRef("sheenColorTextureInfo") : null }
    setSheenColorTexture(e) { return this.setRef("sheenColorTexture", e, { channels: hs | ds | ps, isColor: !0 }) }
    getSheenRoughnessFactor() { return this.get("sheenRoughnessFactor") }
    setSheenRoughnessFactor(e) { return this.set("sheenRoughnessFactor", e) }
    getSheenRoughnessTexture() { return this.getRef("sheenRoughnessTexture") }
    getSheenRoughnessTextureInfo() { return this.getRef("sheenRoughnessTexture") ? this.getRef("sheenRoughnessTextureInfo") : null }
    setSheenRoughnessTexture(e) { return this.setRef("sheenRoughnessTexture", e, { channels: Ts }) }
};
Le.EXTENSION_NAME = X;
var ke = class extends E {
    constructor(...e) { super(...e), this.extensionName = X, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createSheen() { return new Le(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[X]) {
                let i = this.createSheen();
                e.materials[s].setExtension(X, i);
                let c = r.extensions[X];
                if (c.sheenColorFactor !== void 0 && i.setSheenColorFactor(c.sheenColorFactor), c.sheenRoughnessFactor !== void 0 && i.setSheenRoughnessFactor(c.sheenRoughnessFactor), c.sheenColorTexture !== void 0) {
                    let u = c.sheenColorTexture,
                        l = e.textures[t[u.index].source];
                    i.setSheenColorTexture(l), e.setTextureInfo(i.getSheenColorTextureInfo(), u)
                }
                if (c.sheenRoughnessTexture !== void 0) {
                    let u = c.sheenRoughnessTexture,
                        l = e.textures[t[u.index].source];
                    i.setSheenRoughnessTexture(l), e.setTextureInfo(i.getSheenRoughnessTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(X);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[X] = { sheenColorFactor: t.getSheenColorFactor(), sheenRoughnessFactor: t.getSheenRoughnessFactor() };
                if (t.getSheenColorTexture()) {
                    let c = t.getSheenColorTexture(),
                        u = t.getSheenColorTextureInfo();
                    i.sheenColorTexture = e.createTextureInfoDef(c, u)
                }
                if (t.getSheenRoughnessTexture()) {
                    let c = t.getSheenRoughnessTexture(),
                        u = t.getSheenRoughnessTextureInfo();
                    i.sheenRoughnessTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
ke.EXTENSION_NAME = X;
var { R: gs, G: xs, B: ms, A: Es } = Q, Be = class extends R {
    init() { this.extensionName = $, this.propertyType = "Specular", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { specularFactor: 1, specularTexture: null, specularTextureInfo: new A(this.graph, "specularTextureInfo"), specularColorFactor: [1, 1, 1], specularColorTexture: null, specularColorTextureInfo: new A(this.graph, "specularColorTextureInfo") }) }
    getSpecularFactor() { return this.get("specularFactor") }
    setSpecularFactor(e) { return this.set("specularFactor", e) }
    getSpecularColorFactor() { return this.get("specularColorFactor") }
    setSpecularColorFactor(e) { return this.set("specularColorFactor", e) }
    getSpecularTexture() { return this.getRef("specularTexture") }
    getSpecularTextureInfo() { return this.getRef("specularTexture") ? this.getRef("specularTextureInfo") : null }
    setSpecularTexture(e) { return this.setRef("specularTexture", e, { channels: Es }) }
    getSpecularColorTexture() { return this.getRef("specularColorTexture") }
    getSpecularColorTextureInfo() { return this.getRef("specularColorTexture") ? this.getRef("specularColorTextureInfo") : null }
    setSpecularColorTexture(e) { return this.setRef("specularColorTexture", e, { channels: gs | xs | ms, isColor: !0 }) }
};
Be.EXTENSION_NAME = $;
var Ge = class extends E {
    constructor(...e) { super(...e), this.extensionName = $, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createSpecular() { return new Be(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[$]) {
                let i = this.createSpecular();
                e.materials[s].setExtension($, i);
                let c = r.extensions[$];
                if (c.specularFactor !== void 0 && i.setSpecularFactor(c.specularFactor), c.specularColorFactor !== void 0 && i.setSpecularColorFactor(c.specularColorFactor), c.specularTexture !== void 0) {
                    let u = c.specularTexture,
                        l = e.textures[t[u.index].source];
                    i.setSpecularTexture(l), e.setTextureInfo(i.getSpecularTextureInfo(), u)
                }
                if (c.specularColorTexture !== void 0) {
                    let u = c.specularColorTexture,
                        l = e.textures[t[u.index].source];
                    i.setSpecularColorTexture(l), e.setTextureInfo(i.getSpecularColorTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension($);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[$] = {};
                if (t.getSpecularFactor() !== 1 && (i.specularFactor = t.getSpecularFactor()), he.eq(t.getSpecularColorFactor(), [1, 1, 1]) || (i.specularColorFactor = t.getSpecularColorFactor()), t.getSpecularTexture()) {
                    let c = t.getSpecularTexture(),
                        u = t.getSpecularTextureInfo();
                    i.specularTexture = e.createTextureInfoDef(c, u)
                }
                if (t.getSpecularColorTexture()) {
                    let c = t.getSpecularColorTexture(),
                        u = t.getSpecularColorTextureInfo();
                    i.specularColorTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
Ge.EXTENSION_NAME = $;
var { R: Is } = Q, Ue = class extends R {
    init() { this.extensionName = z, this.propertyType = "Transmission", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { transmissionFactor: 0, transmissionTexture: null, transmissionTextureInfo: new A(this.graph, "transmissionTextureInfo") }) }
    getTransmissionFactor() { return this.get("transmissionFactor") }
    setTransmissionFactor(e) { return this.set("transmissionFactor", e) }
    getTransmissionTexture() { return this.getRef("transmissionTexture") }
    getTransmissionTextureInfo() { return this.getRef("transmissionTexture") ? this.getRef("transmissionTextureInfo") : null }
    setTransmissionTexture(e) { return this.setRef("transmissionTexture", e, { channels: Is }) }
};
Ue.EXTENSION_NAME = z;
var ve = class extends E {
    constructor(...e) { super(...e), this.extensionName = z, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createTransmission() { return new Ue(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[z]) {
                let i = this.createTransmission();
                e.materials[s].setExtension(z, i);
                let c = r.extensions[z];
                if (c.transmissionFactor !== void 0 && i.setTransmissionFactor(c.transmissionFactor), c.transmissionTexture !== void 0) {
                    let u = c.transmissionTexture,
                        l = e.textures[t[u.index].source];
                    i.setTransmissionTexture(l), e.setTextureInfo(i.getTransmissionTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(z);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[z] = { transmissionFactor: t.getTransmissionFactor() };
                if (t.getTransmissionTexture()) {
                    let c = t.getTransmissionTexture(),
                        u = t.getTransmissionTextureInfo();
                    i.transmissionTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
ve.EXTENSION_NAME = z;
var Pe = class extends R { init() { this.extensionName = J, this.propertyType = "Unlit", this.parentTypes = [h.MATERIAL] } };
Pe.EXTENSION_NAME = J;
var Ve = class extends E {
    constructor(...e) { super(...e), this.extensionName = J, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createUnlit() { return new Pe(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) { return (e.jsonDoc.json.materials || []).forEach((o, t) => { o.extensions && o.extensions[J] && e.materials[t].setExtension(J, this.createUnlit()) }), this }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            if (o.getExtension(J)) {
                let t = e.materialIndexMap.get(o),
                    r = n.json.materials[t];
                r.extensions = r.extensions || {}, r.extensions[J] = {}
            }
        }), this
    }
};
Ve.EXTENSION_NAME = J;
var He = class extends R {
    init() { this.extensionName = S, this.propertyType = "Mapping", this.parentTypes = ["MappingList"] }
    getDefaults() { return Object.assign(super.getDefaults(), { material: null, variants: new St }) }
    getMaterial() { return this.getRef("material") }
    setMaterial(e) { return this.setRef("material", e) }
    addVariant(e) { return this.addRef("variants", e) }
    removeVariant(e) { return this.removeRef("variants", e) }
    listVariants() { return this.listRefs("variants") }
};
He.EXTENSION_NAME = S;
var Xe = class extends R {
    init() { this.extensionName = S, this.propertyType = "MappingList", this.parentTypes = [h.PRIMITIVE] }
    getDefaults() { return Object.assign(super.getDefaults(), { mappings: new St }) }
    addMapping(e) { return this.addRef("mappings", e) }
    removeMapping(e) { return this.removeRef("mappings", e) }
    listMappings() { return this.listRefs("mappings") }
};
Xe.EXTENSION_NAME = S;
var le = class extends R { init() { this.extensionName = S, this.propertyType = "Variant", this.parentTypes = ["MappingList"] } };
le.EXTENSION_NAME = S;
var $e = class extends E {
    constructor(...e) { super(...e), this.extensionName = S }
    createMappingList() { return new Xe(this.document.getGraph()) }
    createVariant(e = "") { return new le(this.document.getGraph(), e) }
    createMapping() { return new He(this.document.getGraph()) }
    listVariants() { return Array.from(this.properties).filter(e => e instanceof le) }
    read(e) {
        let n = e.jsonDoc;
        if (!n.json.extensions || !n.json.extensions[S]) return this;
        let r = (n.json.extensions[S].variants || []).map(i => this.createVariant().setName(i.name || ""));
        return (n.json.meshes || []).forEach((i, c) => {
            let u = e.meshes[c];
            (i.primitives || []).forEach((f, d) => {
                if (!f.extensions || !f.extensions[S]) return;
                let p = this.createMappingList(),
                    T = f.extensions[S];
                for (let g of T.mappings) { let x = this.createMapping();
                    g.material !== void 0 && x.setMaterial(e.materials[g.material]); for (let b of g.variants || []) x.addVariant(r[b]);
                    p.addMapping(x) }
                u.listPrimitives()[d].setExtension(S, p)
            })
        }), this
    }
    write(e) {
        let n = e.jsonDoc,
            o = this.listVariants();
        if (!o.length) return this;
        let t = [],
            r = new Map;
        for (let s of o) r.set(s, t.length), t.push(e.createPropertyDef(s));
        for (let s of this.document.getRoot().listMeshes()) {
            let i = e.meshIndexMap.get(s);
            s.listPrimitives().forEach((c, u) => {
                let l = c.getExtension(S);
                if (!l) return;
                let f = e.jsonDoc.json.meshes[i].primitives[u],
                    d = l.listMappings().map(p => { let T = e.createPropertyDef(p),
                            g = p.getMaterial(); return g && (T.material = e.materialIndexMap.get(g)), T.variants = p.listVariants().map(x => r.get(x)), T });
                f.extensions = f.extensions || {}, f.extensions[S] = { mappings: d }
            })
        }
        return n.json.extensions = n.json.extensions || {}, n.json.extensions[S] = { variants: t }, this
    }
};
$e.EXTENSION_NAME = S;
var { G: Ns } = Q, ze = class extends R {
    init() { this.extensionName = K, this.propertyType = "Volume", this.parentTypes = [h.MATERIAL] }
    getDefaults() { return Object.assign(super.getDefaults(), { thicknessFactor: 0, thicknessTexture: null, thicknessTextureInfo: new A(this.graph, "thicknessTexture"), attenuationDistance: 1 / 0, attenuationColor: [1, 1, 1] }) }
    getThicknessFactor() { return this.get("thicknessFactor") }
    setThicknessFactor(e) { return this.set("thicknessFactor", e) }
    getThicknessTexture() { return this.getRef("thicknessTexture") }
    getThicknessTextureInfo() { return this.getRef("thicknessTexture") ? this.getRef("thicknessTextureInfo") : null }
    setThicknessTexture(e) { return this.setRef("thicknessTexture", e, { channels: Ns }) }
    getAttenuationDistance() { return this.get("attenuationDistance") }
    setAttenuationDistance(e) { return this.set("attenuationDistance", e) }
    getAttenuationColor() { return this.get("attenuationColor") }
    setAttenuationColor(e) { return this.set("attenuationColor", e) }
};
ze.EXTENSION_NAME = K;
var Ke = class extends E {
    constructor(...e) { super(...e), this.extensionName = K, this.prereadTypes = [h.MESH], this.prewriteTypes = [h.MESH] }
    createVolume() { return new ze(this.document.getGraph()) }
    read(e) { return this }
    write(e) { return this }
    preread(e) {
        let n = e.jsonDoc,
            o = n.json.materials || [],
            t = n.json.textures || [];
        return o.forEach((r, s) => {
            if (r.extensions && r.extensions[K]) {
                let i = this.createVolume();
                e.materials[s].setExtension(K, i);
                let c = r.extensions[K];
                if (c.thicknessFactor !== void 0 && i.setThicknessFactor(c.thicknessFactor), c.attenuationDistance !== void 0 && i.setAttenuationDistance(c.attenuationDistance), c.attenuationColor !== void 0 && i.setAttenuationColor(c.attenuationColor), c.thicknessTexture !== void 0) {
                    let u = c.thicknessTexture,
                        l = e.textures[t[u.index].source];
                    i.setThicknessTexture(l), e.setTextureInfo(i.getThicknessTextureInfo(), u)
                }
            }
        }), this
    }
    prewrite(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listMaterials().forEach(o => {
            let t = o.getExtension(K);
            if (t) {
                let r = e.materialIndexMap.get(o),
                    s = n.json.materials[r];
                s.extensions = s.extensions || {};
                let i = s.extensions[K] = {};
                if (t.getThicknessFactor() > 0 && (i.thicknessFactor = t.getThicknessFactor()), Number.isFinite(t.getAttenuationDistance()) && (i.attenuationDistance = t.getAttenuationDistance()), he.eq(t.getAttenuationColor(), [1, 1, 1]) || (i.attenuationColor = t.getAttenuationColor()), t.getThicknessTexture()) {
                    let c = t.getThicknessTexture(),
                        u = t.getThicknessTextureInfo();
                    i.thicknessTexture = e.createTextureInfoDef(c, u)
                }
            }
        }), this
    }
};
Ke.EXTENSION_NAME = K;
var qe = class extends E {
    constructor(...e) { super(...e), this.extensionName = At }
    read(e) { return this }
    write(e) { return this }
};
qe.EXTENSION_NAME = At;
var ut = class {
    match(e) { return e[0] === 171 && e[1] === 75 && e[2] === 84 && e[3] === 88 && e[4] === 32 && e[5] === 50 && e[6] === 48 && e[7] === 187 && e[8] === 13 && e[9] === 10 && e[10] === 26 && e[11] === 10 }
    getSize(e) { let n = tt(e); return [n.pixelWidth, n.pixelHeight] }
    getChannels(e) { let o = tt(e).dataFormatDescriptor[0]; if (o.colorModel === kt) return o.samples.length === 2 && (o.samples[1].channelType & 15) === 15 ? 4 : 3; if (o.colorModel === Bt) return (o.samples[0].channelType & 15) === 3 ? 4 : 3; throw new Error(`Unexpected KTX2 colorModel, "${o.colorModel}".`) }
    getVRAMByteLength(e) {
        let n = tt(e),
            o = this.getChannels(e) > 3,
            t = 0;
        for (let r = 0; r < n.levels.length; r++) {
            let s = n.levels[r];
            if (s.uncompressedByteLength) t += s.uncompressedByteLength;
            else {
                let i = Math.max(1, Math.floor(n.pixelWidth / Math.pow(2, r))),
                    c = Math.max(1, Math.floor(n.pixelHeight / Math.pow(2, r))),
                    u = o ? 16 : 8;
                t += i / 4 * (c / 4) * u
            }
        }
        return t
    }
}, Ye = class extends E {
    constructor(...e) { super(...e), this.extensionName = oe, this.prereadTypes = [h.TEXTURE] }
    static register() { ft.registerFormat("image/ktx2", new ut) }
    preread(e) { return e.jsonDoc.json.textures.forEach(n => { if (n.extensions && n.extensions[oe]) { let o = n.extensions[oe];
                n.source = o.source } }), this }
    read(e) { return this }
    write(e) {
        let n = e.jsonDoc;
        return this.document.getRoot().listTextures().forEach(o => {
            if (o.getMimeType() === "image/ktx2") {
                let t = e.imageIndexMap.get(o);
                n.json.textures.forEach(r => { r.source === t && (r.extensions = r.extensions || {}, r.extensions[oe] = { source: r.source }, delete r.source) })
            }
        }), this
    }
};
Ye.EXTENSION_NAME = oe;
var Qe = class extends R {
    init() { this.extensionName = q, this.propertyType = "Transform", this.parentTypes = [h.TEXTURE_INFO] }
    getDefaults() { return Object.assign(super.getDefaults(), { offset: [0, 0], rotation: 0, scale: [1, 1], texCoord: null }) }
    getOffset() { return this.get("offset") }
    setOffset(e) { return this.set("offset", e) }
    getRotation() { return this.get("rotation") }
    setRotation(e) { return this.set("rotation", e) }
    getScale() { return this.get("scale") }
    setScale(e) { return this.set("scale", e) }
    getTexCoord() { return this.get("texCoord") }
    setTexCoord(e) { return this.set("texCoord", e) }
};
Qe.EXTENSION_NAME = q;
var We = class extends E {
    constructor(...e) { super(...e), this.extensionName = q }
    createTransform() { return new Qe(this.document.getGraph()) }
    read(e) {
        for (let [n, o] of Array.from(e.textureInfos.entries())) {
            if (!o.extensions || !o.extensions[q]) continue;
            let t = this.createTransform(),
                r = o.extensions[q];
            r.offset !== void 0 && t.setOffset(r.offset), r.rotation !== void 0 && t.setRotation(r.rotation), r.scale !== void 0 && t.setScale(r.scale), r.texCoord !== void 0 && t.setTexCoord(r.texCoord), n.setExtension(q, t)
        }
        return this
    }
    write(e) {
        let n = Array.from(e.textureInfoDefMap.entries());
        for (let [o, t] of n) {
            let r = o.getExtension(q);
            if (!r) continue;
            t.extensions = t.extensions || {};
            let s = {},
                i = he.eq;
            i(r.getOffset(), [0, 0]) || (s.offset = r.getOffset()), r.getRotation() !== 0 && (s.rotation = r.getRotation()), i(r.getScale(), [1, 1]) || (s.scale = r.getScale()), r.getTexCoord() != null && (s.texCoord = r.getTexCoord()), t.extensions[q] = s
        }
        return this
    }
};
We.EXTENSION_NAME = q;
var Rs = [h.ROOT, h.SCENE, h.NODE, h.MESH, h.MATERIAL, h.TEXTURE, h.ANIMATION],
    Je = class extends R {
        init() { this.extensionName = C, this.propertyType = "Packet", this.parentTypes = Rs }
        getDefaults() { return Object.assign(super.getDefaults(), { context: {}, properties: {} }) }
        getContext() { return this.get("context") }
        setContext(e) { return this.set("context", Y({}, e)) }
        listProperties() { return Object.keys(this.get("properties")) }
        getProperty(e) { let n = this.get("properties"); return e in n ? n[e] : null }
        setProperty(e, n) { this._assertContext(e); let o = Y({}, this.get("properties")); return n ? o[e] = n : delete o[e], this.set("properties", o) }
        toJSONLD() { let e = st(this.get("context")),
                n = st(this.get("properties")); return Y({ "@context": e }, n) }
        fromJSONLD(e) { e = st(e); let n = e["@context"]; return n && this.set("context", n), delete e["@context"], this.set("properties", e) }
        _assertContext(e) { if (!(e.split(":")[0] in this.get("context"))) throw new Error(`${C}: Missing context for term, "${e}".`) }
    };
Je.EXTENSION_NAME = C;

function st(a) { return JSON.parse(JSON.stringify(a)) }
var Ze = class extends E {
    constructor(...e) { super(...e), this.extensionName = C }
    createPacket() { return new Je(this.document.getGraph()) }
    listPackets() { return Array.from(this.properties) }
    read(e) {
        var n;
        let o = (n = e.jsonDoc.json.extensions) == null ? void 0 : n[C];
        if (!o || !o.packets) return this;
        let t = e.jsonDoc.json,
            r = this.document.getRoot(),
            s = o.packets.map(u => this.createPacket().fromJSONLD(u)),
            i = [
                [t.asset], t.scenes, t.nodes, t.meshes, t.materials, t.images, t.animations
            ],
            c = [
                [r], r.listScenes(), r.listNodes(), r.listMeshes(), r.listMaterials(), r.listTextures(), r.listAnimations()
            ];
        for (let u = 0; u < i.length; u++) {
            let l = i[u] || [];
            for (let f = 0; f < l.length; f++) {
                let d = l[f];
                if (d.extensions && d.extensions[C]) { let p = d.extensions[C];
                    c[u][f].setExtension(C, s[p.packet]) }
            }
        }
        return this
    }
    write(e) {
        let { json: n } = e.jsonDoc, o = [];
        for (let t of this.properties) {
            o.push(t.toJSONLD());
            for (let r of t.listParents()) {
                let s;
                switch (r.propertyType) {
                    case h.ROOT:
                        s = n.asset;
                        break;
                    case h.SCENE:
                        s = n.scenes[e.sceneIndexMap.get(r)];
                        break;
                    case h.NODE:
                        s = n.nodes[e.nodeIndexMap.get(r)];
                        break;
                    case h.MESH:
                        s = n.meshes[e.meshIndexMap.get(r)];
                        break;
                    case h.MATERIAL:
                        s = n.materials[e.materialIndexMap.get(r)];
                        break;
                    case h.TEXTURE:
                        s = n.images[e.imageIndexMap.get(r)];
                        break;
                    case h.ANIMATION:
                        s = n.animations[e.animationIndexMap.get(r)];
                        break;
                    default:
                        s = null, this.document.getLogger().warn(`[${C}]: Unsupported parent property, "${r.propertyType}"`);
                        break
                }
                s && (s.extensions = s.extensions || {}, s.extensions[C] = { packet: o.length - 1 })
            }
        }
        return o.length > 0 && (n.extensions = n.extensions || {}, n.extensions[C] = { packets: o }), this
    }
};
Ze.EXTENSION_NAME = C;
var Ds = [fe, me, Ie, Re, ye, Ae, Me, Oe, be, je, Ge, ke, ve, Ve, $e, Ke, qe, Ye, We, Ze],
    As = [Te, ce, ge, xe, ...Ds];
export { As as ALL_EXTENSIONS, Ee as Anisotropy, Ne as Clearcoat, De as DiffuseTransmission, Se as Dispersion, Te as EXTMeshGPUInstancing, ce as EXTMeshoptCompression, ge as EXTTextureAVIF, xe as EXTTextureWebP, _e as EmissiveStrength, ot as INSTANCE_ATTRIBUTE, Ce as IOR, pe as InstancedMesh, we as Iridescence, fe as KHRDracoMeshCompression, me as KHRLightsPunctual, Ie as KHRMaterialsAnisotropy, Re as KHRMaterialsClearcoat, ye as KHRMaterialsDiffuseTransmission, Ae as KHRMaterialsDispersion, Me as KHRMaterialsEmissiveStrength, Oe as KHRMaterialsIOR, be as KHRMaterialsIridescence, je as KHRMaterialsPBRSpecularGlossiness, ke as KHRMaterialsSheen, Ge as KHRMaterialsSpecular, ve as KHRMaterialsTransmission, Ve as KHRMaterialsUnlit, $e as KHRMaterialsVariants, Ke as KHRMaterialsVolume, qe as KHRMeshQuantization, Ds as KHRONOS_EXTENSIONS, Ye as KHRTextureBasisu, We as KHRTextureTransform, Ze as KHRXMP, te as Light, He as Mapping, Xe as MappingList, Fe as PBRSpecularGlossiness, Je as Packet, Le as Sheen, Be as Specular, Qe as Transform, Ue as Transmission, Pe as Unlit, le as Variant, ze as Volume };
//# sourceMappingURL=extensions.mjs.map
