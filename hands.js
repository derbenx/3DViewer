import * as THREE from 'three';

// --- Constants ---
const JOINT_RADIUS = 0.008;
const BONE_RADIUS = 0.005;

const XR_STANDARD_JOINT_NAMES = [
  'wrist',
  'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
  'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
  'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
  'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
  'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip',
];

const BONE_CONNECTIONS = {
    "wrist": ["thumb-metacarpal", "index-finger-metacarpal", "middle-finger-metacarpal", "ring-finger-metacarpal", "pinky-finger-metacarpal"],
    "thumb-metacarpal": ["thumb-phalanx-proximal"],
    "thumb-phalanx-proximal": ["thumb-phalanx-distal"],
    "thumb-phalanx-distal": ["thumb-tip"],
    "index-finger-metacarpal": ["index-finger-phalanx-proximal"],
    "index-finger-phalanx-proximal": ["index-finger-phalanx-intermediate"],
    "index-finger-phalanx-intermediate": ["index-finger-phalanx-distal"],
    "index-finger-phalanx-distal": ["index-finger-tip"],
    "middle-finger-metacarpal": ["middle-finger-phalanx-proximal"],
    "middle-finger-phalanx-proximal": ["middle-finger-phalanx-intermediate"],
    "middle-finger-phalanx-intermediate": ["middle-finger-phalanx-distal"],
    "middle-finger-phalanx-distal": ["middle-finger-tip"],
    "ring-finger-metacarpal": ["ring-finger-phalanx-proximal"],
    "ring-finger-phalanx-proximal": ["ring-finger-phalanx-intermediate"],
    "ring-finger-phalanx-intermediate": ["ring-finger-phalanx-distal"],
    "ring-finger-phalanx-distal": ["ring-finger-tip"],
    "pinky-finger-metacarpal": ["pinky-finger-phalanx-proximal"],
    "pinky-finger-phalanx-proximal": ["pinky-finger-phalanx-intermediate"],
    "pinky-finger-phalanx-intermediate": ["pinky-finger-phalanx-distal"],
    "pinky-finger-phalanx-distal": ["pinky-finger-tip"],
};

// A default set of joint positions for rendering a static hand model for diagnostics.
const DEFAULT_HAND_PROFILE = {
    'wrist': { position: new THREE.Vector3(0, 0, 0) },
    'thumb-metacarpal': { position: new THREE.Vector3(-0.01, 0.02, 0.015) },
    'thumb-phalanx-proximal': { position: new THREE.Vector3(-0.04, 0.03, 0.02) },
    'thumb-phalanx-distal': { position: new THREE.Vector3(-0.06, 0.04, 0.03) },
    'thumb-tip': { position: new THREE.Vector3(-0.08, 0.05, 0.035) },
    'index-finger-metacarpal': { position: new THREE.Vector3(-0.015, 0.05, 0) },
    'index-finger-phalanx-proximal': { position: new THREE.Vector3(-0.02, 0.08, 0) },
    'index-finger-phalanx-intermediate': { position: new THREE.Vector3(-0.025, 0.11, 0) },
    'index-finger-phalanx-distal': { position: new THREE.Vector3(-0.03, 0.13, 0) },
    'index-finger-tip': { position: new THREE.Vector3(-0.035, 0.15, 0) },
    'middle-finger-metacarpal': { position: new THREE.Vector3(0, 0.055, -0.005) },
    'middle-finger-phalanx-proximal': { position: new THREE.Vector3(0, 0.09, -0.005) },
    'middle-finger-phalanx-intermediate': { position: new THREE.Vector3(0, 0.13, -0.005) },
    'middle-finger-phalanx-distal': { position: new THREE.Vector3(0, 0.15, -0.005) },
    'middle-finger-tip': { position: new THREE.Vector3(0, 0.17, -0.005) },
    'ring-finger-metacarpal': { position: new THREE.Vector3(0.015, 0.05, 0) },
    'ring-finger-phalanx-proximal': { position: new THREE.Vector3(0.02, 0.08, 0) },
    'ring-finger-phalanx-intermediate': { position: new THREE.Vector3(0.025, 0.11, 0) },
    'ring-finger-phalanx-distal': { position: new THREE.Vector3(0.03, 0.13, 0) },
    'ring-finger-tip': { position: new THREE.Vector3(0.035, 0.15, 0) },
    'pinky-finger-metacarpal': { position: new THREE.Vector3(0.03, 0.04, 0.005) },
    'pinky-finger-phalanx-proximal': { position: new THREE.Vector3(0.04, 0.06, 0.005) },
    'pinky-finger-phalanx-intermediate': { position: new THREE.Vector3(0.045, 0.08, 0.005) },
    'pinky-finger-phalanx-distal': { position: new THREE.Vector3(0.05, 0.10, 0.005) },
    'pinky-finger-tip': { position: new THREE.Vector3(0.055, 0.12, 0.005) }
};

export class Hand {
    constructor(handObj = null) {
        this.hand = handObj; // Can be null for the diagnostic model
        this.model = new THREE.Group();
        this.joints = {}; // Map to store joint meshes
        this.bones = {}; // Map to store bone meshes

        this._createModelGeometry();

        if (!this.hand) {
            // This is a static, diagnostic hand. Update it once with the default profile.
            this.update(DEFAULT_HAND_PROFILE);
        }
    }

    _createModelGeometry() {
        const jointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan
        const boneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White
        const jointGeometry = new THREE.SphereGeometry(JOINT_RADIUS, 10, 10);

        for (const jointName of XR_STANDARD_JOINT_NAMES) {
            const jointMesh = new THREE.Mesh(jointGeometry, jointMaterial);
            jointMesh.name = jointName;
            this.joints[jointName] = jointMesh;
            this.model.add(jointMesh);
        }

        for (const startJoint in BONE_CONNECTIONS) {
            for (const endJoint of BONE_CONNECTIONS[startJoint]) {
                // The bone geometry is a unit cylinder. We will scale and rotate it in the update loop.
                const boneGeometry = new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS, 1, 8);
                const boneMesh = new THREE.Mesh(boneGeometry, boneMaterial);
                boneMesh.name = `${startJoint}-${endJoint}`;
                this.bones[`${startJoint}-${endJoint}`] = boneMesh;
                this.model.add(boneMesh);
            }
        }
    }

    update(handData) {
        // If we have live data, use its 'joints' property (which is a Map).
        // If we have static data (like our default profile), use it directly (as an object).
        const jointsSource = handData?.joints || handData;

        if (!jointsSource) {
            this.model.visible = false;
            return;
        }
        this.model.visible = true;

        const isMap = jointsSource instanceof Map;

        // Update Joints
        for (const jointName of XR_STANDARD_JOINT_NAMES) {
            const jointData = isMap ? jointsSource.get(jointName) : jointsSource[jointName];
            const jointMesh = this.joints[jointName];

            if (jointData && jointMesh) {
                jointMesh.visible = true;
                jointMesh.position.copy(jointData.position);
                if (jointData.quaternion) {
                    jointMesh.quaternion.copy(jointData.quaternion);
                }
            } else if (jointMesh) {
                jointMesh.visible = false;
            }
        }

        // Update Bones
        for (const startJointName in BONE_CONNECTIONS) {
            for (const endJointName of BONE_CONNECTIONS[startJointName]) {
                const boneMesh = this.bones[`${startJointName}-${endJointName}`];
                const startJointMesh = this.joints[startJointName];
                const endJointMesh = this.joints[endJointName];

                if (boneMesh && startJointMesh && endJointMesh && startJointMesh.visible && endJointMesh.visible) {
                    boneMesh.visible = true;
                    const startPos = startJointMesh.position;
                    const endPos = endJointMesh.position;

                    // Calculate bone length and orientation
                    const distance = startPos.distanceTo(endPos);
                    boneMesh.scale.y = distance;

                    // Position bone in the middle of the two joints
                    boneMesh.position.copy(startPos).lerp(endPos, 0.5);

                    // Orient the bone to point from start to end
                    boneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(endPos, startPos).normalize());
                } else if (boneMesh) {
                    boneMesh.visible = false;
                }
            }
        }
    }
}
