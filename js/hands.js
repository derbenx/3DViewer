import * as THREE from 'three';

// Defines the names of the joints in the hand, in the order specified by the WebXR API
const XR_HAND_JOINTS = [
  "wrist",
  "thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip",
  "index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-phalanx-intermediate", "index-finger-phalanx-distal", "index-finger-tip",
  "middle-finger-metacarpal", "middle-finger-phalanx-proximal", "middle-finger-phalanx-intermediate", "middle-finger-phalanx-distal", "middle-finger-tip",
  "ring-finger-metacarpal", "ring-finger-phalanx-proximal", "ring-finger-phalanx-intermediate", "ring-finger-phalanx-distal", "ring-finger-tip",
  "pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-phalanx-intermediate", "pinky-finger-phalanx-distal", "pinky-finger-tip",
];

// Defines the connections between the joints to form the bones of the hand
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

/**
 * A class that creates and manages a 3D hand model for WebXR.
 * This class relies on the Three.js XRHandSpace object being updated externally.
 */
export class Hand {
    constructor(handModel, handedness) {
        this.handModel = handModel; // THREE.XRHandSpace
        this.handedness = handedness;

        // Use the joints from the hand model directly. These are Object3Ds
        // that are updated by the WebXRManager.
        this.joints = this.handModel.joints;
        this.bones = {};

        const jointMaterial = new THREE.MeshStandardMaterial({
            color: 0x00bbaa,
            metalness: 0.1,
            roughness: 0.5
        });
        const boneMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.5
        });

        // Add visible spheres to the existing joint Object3Ds for visualization
        for (const joint of Object.values(this.joints)) {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.003, 10, 10),
                jointMaterial
            );
            joint.add(sphere);
        }

        // Create bone meshes and add them to the hand model group
        for (const startJointName in BONE_CONNECTIONS) {
            const endJointNames = BONE_CONNECTIONS[startJointName];
            for (const endJointName of endJointNames) {
                const bone = new THREE.Mesh(
                    // The cylinder is oriented along the Y-axis.
                    new THREE.CylinderGeometry(0.002, 0.002, 1, 12),
                    boneMaterial
                );
                const boneName = `${startJointName}-${endJointName}`;
                bone.name = boneName;
                this.bones[boneName] = bone;
                this.handModel.add(bone);
            }
        }
    }

    /**
     * Updates the positions of the hand's bones based on the current joint positions.
     */
    update() {
        this.handModel.visible = true;

        for (const boneName in this.bones) {
            const boneMesh = this.bones[boneName];
            const [startJointName, endJointName] = boneName.split('-');

            const startJoint = this.joints[startJointName];
            const endJoint = this.joints[endJointName];

            if (startJoint && endJoint) {
                const startPos = startJoint.position;
                const endPos = endJoint.position;
                const distance = startPos.distanceTo(endPos);

                // Hide bone if joints are not being tracked or are in the same spot.
                if (distance > 0.001) {
                    boneMesh.scale.y = distance;
                    boneMesh.position.lerpVectors(startPos, endPos, 0.5);
                    boneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());
                    boneMesh.visible = true;
                } else {
                    boneMesh.visible = false;
                }
            } else {
                boneMesh.visible = false;
            }
        }
    }
}
