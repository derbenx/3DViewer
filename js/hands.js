import * as THREE from 'three';

const logDebug = false; // Set to true to enable logging

function logToServer(message) {
    if (!logDebug) return;
    fetch('log_debug.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: message,
    }).catch(error => console.error('Error logging to server:', error));
}

// Constants for hand visualization
const JOINT_RADIUS = 0.003;
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

        this.handModel.visible = false;
    }

    /**
     * Updates the positions of the hand's joints and bones based on the XRFrame data.
     * @param {XRFrame} xrFrame - The current XR frame.
     * @param {XRReferenceSpace} referenceSpace - The reference space for poses.
     */
    update(xrFrame, referenceSpace) {
        let handInputSource = null;
        for (const source of xrFrame.session.inputSources) {
            if (source.handedness === this.handedness && source.hand) {
                handInputSource = source.hand;
                break;
            }
        }

        if (handInputSource) {
            this.handModel.visible = true;
            // Update the visibility and pose of each joint
            for (const jointName in this.joints) {
                const jointMesh = this.joints[jointName];
                const xrJoint = handInputSource.get(jointName);
                if (xrJoint) {
                    const pose = xrFrame.getJointPose(xrJoint, referenceSpace);
                    if (pose) {
                        jointMesh.matrix.fromArray(pose.transform.matrix);
                        jointMesh.matrixAutoUpdate = false;
                        jointMesh.visible = true;
                    } else {
                        jointMesh.visible = false;
                    }
                } else {
                    jointMesh.visible = false;
                }
            }

            // Update the visibility, scale, and orientation of each bone
            for (const startJointName in BONE_CONNECTIONS) {
                const endJointNames = BONE_CONNECTIONS[startJointName];
                for (const endJointName of endJointNames) {
                    const boneName = `${startJointName}-${endJointName}`;
                    const boneMesh = this.bones[boneName];

                    const startJoint = this.joints[startJointName];
                    const endJoint = this.joints[endJointName];

                    if (startJoint && endJoint && startJoint.visible && endJoint.visible) {
                        const startPos = new THREE.Vector3().setFromMatrixPosition(startJoint.matrix);
                        const endPos = new THREE.Vector3().setFromMatrixPosition(endJoint.matrix);

                        const distance = startPos.distanceTo(endPos);
                        boneMesh.scale.y = distance;

                        boneMesh.position.lerpVectors(startPos, endPos, 0.5);

                        const up = new THREE.Vector3(0, 1, 0);
                        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
                        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
                        boneMesh.setRotationFromQuaternion(quaternion);

                        boneMesh.visible = true;
                    } else {
                        boneMesh.visible = false;
                    }
                }
            }

            if (logDebug) {
                const timestamp = new Date().toISOString();
                let logParts = [timestamp];
                let sphereLogs = [];
                for (const jointName of XR_HAND_JOINTS) {
                    if (jointName === 'wrist' || jointName.startsWith('thumb-')) {
                        const jointMesh = this.joints[jointName];
                        if (jointMesh && jointMesh.visible) {
                            const pos = new THREE.Vector3().setFromMatrixPosition(jointMesh.matrix);
                            sphereLogs.push(`  ${jointName}: {x: ${pos.x.toFixed(4)}, y: ${pos.y.toFixed(4)}, z: ${pos.z.toFixed(4)}}`);
                        }
                    }
                }
                if (sphereLogs.length > 0) {
                    logParts.push("THUMB SPHERES:");
                    logParts.push(...sphereLogs);
                }
                let cylinderLogs = [];
                for (const boneName in this.bones) {
                    if (boneName.startsWith('wrist-thumb') || boneName.startsWith('thumb-')) {
                        const boneMesh = this.bones[boneName];
                        if (boneMesh) {
                            const pos = boneMesh.position;
                            const len = boneMesh.scale.y;
                            const vis = boneMesh.visible;
                            cylinderLogs.push(`  ${boneName}: vis: ${vis}, pos: {x: ${pos.x.toFixed(4)}, y: ${pos.y.toFixed(4)}, z: ${pos.z.toFixed(4)}}, len: ${len.toFixed(4)}`);
                        }
                    }
                }
                if (cylinderLogs.length > 0) {
                    logParts.push("THUMB CYLINDERS:");
                    logParts.push(...cylinderLogs);
                }
                if (sphereLogs.length > 0) {
                    logToServer(logParts.join('\n'));
                }
            }
        } else {
            this.handModel.visible = false;
        }
    }
}
