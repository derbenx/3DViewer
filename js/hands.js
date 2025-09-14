import * as THREE from 'three';

// --- Server-side Logging ---
function logToServer(message) {
    const timestamp = new Date().toISOString();
    let finalMessage;
    if (typeof message === 'object') {
        try {
            finalMessage = `${timestamp}: ${JSON.stringify(message, null, 2)}`;
        } catch (e) {
            finalMessage = `${timestamp}: [Unserializable Object]`;
        }
    } else {
        finalMessage = `${timestamp}: ${message}`;
    }
    const dataToSend = new URLSearchParams();
    dataToSend.append('log', finalMessage);
    navigator.sendBeacon('log_debug.php', dataToSend);
}
// --- End Logging ---

// Constants for hand visualization
const JOINT_RADIUS = 0.006;
const BONE_RADIUS = 0.004;

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
 */
export class Hand {
    constructor(handModel, handedness) {
        this.handModel = handModel;
        this.handedness = handedness;
        this.joints = {};
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

        // Create joint meshes
        for (const jointName of XR_HAND_JOINTS) {
            const joint = new THREE.Mesh(
                new THREE.SphereGeometry(JOINT_RADIUS, 10, 10),
                jointMaterial
            );
            joint.name = jointName;
            this.joints[jointName] = joint;
            this.handModel.add(joint);
        }

        // Create bone meshes
        for (const startJoint in BONE_CONNECTIONS) {
            const endJoints = BONE_CONNECTIONS[startJoint];
            for (const endJoint of endJoints) {
                // The bone is a cylinder that will be scaled and oriented between two joints.
                // We give it a default length of 1; the `update` method will scale it.
                const bone = new THREE.Mesh(
                    new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS, 1, 12),
                    boneMaterial
                );
                const boneName = `${startJoint}-${endJoint}`;
                bone.name = boneName;
                this.bones[boneName] = bone;
                this.handModel.add(bone);
            }
        }

        // Hide the hand until it's actively tracking
        this.handModel.visible = false;
    }

    /**
     * Updates the positions of the hand's joints and bones based on the XRFrame data.
     * @param {XRFrame} xrFrame - The current XR frame.
     * @param {XRReferenceSpace} referenceSpace - The reference space for poses.
     */
    update(xrFrame, referenceSpace) {
        if (!this.handModel.visible) {
            return;
        }

        let handInputSource = null;
        for (const source of xrFrame.session.inputSources) {
            if (source.handedness === this.handedness && source.hand) {
                handInputSource = source.hand;
                break;
            }
        }

        if (handInputSource) {
            // Update the visibility and pose of each joint
            for (const jointName in this.joints) {
                const jointMesh = this.joints[jointName];
                const xrJoint = handInputSource.get(jointName);
                if (xrJoint) {
                    const pose = xrFrame.getJointPose(xrJoint, referenceSpace);
                    if (jointName === 'wrist') {
                        logToServer({ msg: 'Wrist Pose', matrix: Array.from(pose.transform.matrix) });
                    }
                    if (pose) {
                        jointMesh.matrix.fromArray(pose.transform.matrix);
                        jointMesh.matrixAutoUpdate = false; // Important: we are setting the matrix directly
                        jointMesh.visible = true;
                    } else {
                        jointMesh.visible = false;
                    }
                } else {
                    jointMesh.visible = false;
                }
            }

            // Update the visibility, scale, and orientation of each bone
            for (const boneName in this.bones) {
                const boneMesh = this.bones[boneName];
                const [startJointName, endJointName] = boneName.split('-');

                const startJoint = this.joints[startJointName];
                const endJoint = this.joints[endJointName];

                // Only display the bone if both of its joints are visible
                if (startJoint && endJoint && startJoint.visible && endJoint.visible) {
                    const startPos = startJoint.position;
                    const endPos = endJoint.position;

                    // Calculate bone length and scale the cylinder accordingly
                    const distance = startPos.distanceTo(endPos);
                    boneMesh.scale.y = distance;

                    // Position the bone in the middle of the two joints
                    boneMesh.position.lerpVectors(startPos, endPos, 0.5);

                    // Orient the bone to point from the start joint to the end joint
                    boneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());

                    if (boneName === 'wrist-thumb-metacarpal') {
                        logToServer({
                            msg: 'Bone Calc',
                            name: boneName,
                            start: startPos.toArray(),
                            end: endPos.toArray(),
                            distance: distance
                        });
                    }
                    boneMesh.visible = true;
                } else {
                    boneMesh.visible = false;
                }
            }
        }
    }
}
