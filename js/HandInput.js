import * as THREE from 'three';

const JOINT_RADIUS = 0.008;
const BONE_RADIUS = 0.005;

// These are the standard WebXR joint names
const XR_STANDARD_JOINT_NAMES = [
  'wrist',
  'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
  'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
  'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
  'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
  'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip',
];

// Defines the connections between the joints
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

export class HandInput {
    constructor() {
        this.handModel = new THREE.Group();
        this.joints = {}; // Map to store joint meshes
        this.bones = {}; // Map to store bone meshes

        const jointMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff, // Cyan
            roughness: 0.2,
            metalness: 0.8
        });
        const boneMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // White
            roughness: 0.2,
            metalness: 0.8
        });

        const jointGeometry = new THREE.SphereGeometry(JOINT_RADIUS, 16, 16);

        // Create a mesh for each joint
        for (const jointName of XR_STANDARD_JOINT_NAMES) {
            const jointMesh = new THREE.Mesh(jointGeometry, jointMaterial);
            jointMesh.name = jointName;
            this.joints[jointName] = jointMesh;
            this.handModel.add(jointMesh);
        }

        // Create a mesh for each bone
        for (const startJoint in BONE_CONNECTIONS) {
            const endJoints = BONE_CONNECTIONS[startJoint];
            for (const endJoint of endJoints) {
                const boneName = `${startJoint}-${endJoint}`;
                // Using a cylinder for the bone. The geometry will be updated on the fly.
                const boneGeometry = new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS, 1, 8);
                const boneMesh = new THREE.Mesh(boneGeometry, boneMaterial);
                boneMesh.name = boneName;
                this.bones[boneName] = boneMesh;
                this.handModel.add(boneMesh);
            }
        }
    }

    // This method will be called on each frame
    update(hand) {
        // Hide all joints and bones first
        for (const jointName in this.joints) {
            this.joints[jointName].visible = false;
        }
        for (const boneName in this.bones) {
            this.bones[boneName].visible = false;
        }

        const tempMatrix = new THREE.Matrix4();

        // Update and show joints that have data
        for (const joint of hand.values()) {
            const jointMesh = this.joints[joint.jointName];
            if (jointMesh) {
                tempMatrix.fromArray(joint.transformMatrix);
                tempMatrix.decompose(jointMesh.position, jointMesh.quaternion, jointMesh.scale);
                jointMesh.visible = true;
            }
        }

        // Update and show bones for visible joints
        for (const startJoint in BONE_CONNECTIONS) {
            const endJoints = BONE_CONNECTIONS[startJoint];
            for (const endJoint of endJoints) {
                const boneName = `${startJoint}-${endJoint}`;
                const boneMesh = this.bones[boneName];
                const startMesh = this.joints[startJoint];
                const endMesh = this.joints[endJoint];

                if (boneMesh && startMesh && endMesh && startMesh.visible && endMesh.visible) {
                    const startPos = startMesh.position;
                    const endPos = endMesh.position;

                    const distance = startPos.distanceTo(endPos);
                    boneMesh.scale.y = distance;

                    boneMesh.position.copy(startPos).lerp(endPos, 0.5);

                    boneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(endPos, startPos).normalize());
                    boneMesh.visible = true;
                }
            }
        }
    }
}
