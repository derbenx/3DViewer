import * as THREE from 'three';

// Make the radius constants available for tweaking.
export const BONE_RADIUS = 0.004;
export const JOINT_RADIUS = 0.003;

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
        for (const bone of this.bones) {
            const [startJointName, endJointName] = bone.name.split('-');

            const startJoint = this.handModel.joints[startJointName];
            const endJoint = this.handModel.joints[endJointName];

            if (startJoint && endJoint) {
                const localStart = new THREE.Vector3();
                const localEnd = new THREE.Vector3();

                // The joint positions are in world space, so we need to convert
                // them to the local space of the hand model.
                this.handModel.worldToLocal(startJoint.getWorldPosition(localStart));
                this.handModel.worldToLocal(endJoint.getWorldPosition(localEnd));

                // Calculate the distance and set the bone's scale.
                const distance = localStart.distanceTo(localEnd);
                bone.scale.y = distance;

                // Position the bone in the midpoint
                bone.position.lerpVectors(localStart, localEnd, 0.5);

                // Orient the bone using lookAt
                bone.lookAt(localEnd);

                // The default cylinder geometry is oriented along the Y axis.
                // `lookAt` orients the Z axis. We need to rotate the bone
                // by 90 degrees around its X axis to align its length with the lookAt direction.
                bone.rotateX(Math.PI / 2);

                bone.visible = true;
            } else {
                bone.visible = false;
            }
        }
    }
}
