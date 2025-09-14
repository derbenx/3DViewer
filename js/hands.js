import * as THREE from 'three';

// Make the radius constants available for tweaking.
export const BONE_RADIUS = 0.004;
export const JOINT_RADIUS = 0.003; // This is not used here, but exported for consistency if needed elsewhere.

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
 * A class that creates and manages the connecting "bone" meshes for a WebXR hand model.
 * It works by augmenting the THREE.XRHandSpace object provided by the renderer.
 */
export class Hand {
    constructor(handModel) {
        this.handModel = handModel; // This is the THREE.XRHandSpace object
        this.bones = [];

        const boneMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.5
        });

        // Create and add the bone meshes to the hand model
        for (const startJoint in BONE_CONNECTIONS) {
            const endJoints = BONE_CONNECTIONS[startJoint];
            for (const endJoint of endJoints) {
                const bone = new THREE.Mesh(
                    new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS, 1, 12),
                    boneMaterial
                );
                bone.name = `${startJoint}-${endJoint}`;
                this.bones.push(bone);
                this.handModel.add(bone);
            }
        }
    }

    /**
     * Updates the positions and orientations of the bone meshes.
     */
    update() {
        // The handModel is the THREE.XRHandSpace object, which is a Group.
        // Its `joints` property is a map of the XRJointSpace objects (also Groups).
        // Three.js updates the matrices of these joint groups automatically.
        // We just need to connect them with our bone meshes.
        for (const bone of this.bones) {
            const [startJointName, endJointName] = bone.name.split('-');

            const startJoint = this.handModel.joints[startJointName];
            const endJoint = this.handModel.joints[endJointName];

            // The joints are managed by three.js, so we check if they are available.
            if (startJoint && endJoint) {
                const startPos = new THREE.Vector3();
                const endPos = new THREE.Vector3();

                // Get the world position of the joints
                startJoint.getWorldPosition(startPos);
                endJoint.getWorldPosition(endPos);

                // The bone mesh is a child of the handModel, so its transforms should be
                // relative to the handModel's local space. We need to convert the world
                // positions of the joints into the handModel's local space.
                const localStart = this.handModel.worldToLocal(startPos.clone());
                const localEnd = this.handModel.worldToLocal(endPos.clone());

                // Calculate the distance and set the bone's scale.
                const distance = localStart.distanceTo(localEnd);
                bone.scale.y = distance;

                // Position the bone in the midpoint between the two joints.
                bone.position.lerpVectors(localStart, localEnd, 0.5);

                // Orient the bone to point from the start joint to the end joint.
                bone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localEnd.clone().sub(localStart).normalize());

                bone.visible = true;
            } else {
                // Hide the bone if one of its joints is not tracking.
                bone.visible = false;
            }
        }
    }
}
