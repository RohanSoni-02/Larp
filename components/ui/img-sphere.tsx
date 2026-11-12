import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { Icon } from '@/src/components/Icon';
import { fonts, useTheme } from '@/src/theme';

/**
 * SphereImageGrid - Interactive 3D Image Sphere Component
 *
 * A React TypeScript component that displays skill/media images arranged in a 3D sphere layout.
 * Images are distributed using Fibonacci sphere distribution for optimal coverage.
 * Supports drag-to-rotate, momentum physics, auto-rotation, and modal image viewing.
 * Compatible with Expo (iOS, Android, and Web).
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number;  // Azimuth angle in degrees
  phi: number;    // Polar angle in degrees
  radius: number; // Distance from center
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  skillId?: string;
  badge?: string;
  color?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SphereImageGridProps {
  images?: ImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  selectedSkillId?: string | null;
  showLabels?: boolean;
  onSelectImage?: (image: ImageData) => void;
}

interface RotationState {
  x: number;
  y: number;
  z: number;
}

interface VelocityState {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),

  sphericalToCartesian: (radius: number, theta: number, phi: number): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }),

  calculateDistance: (pos: Position3D, center: Position3D = { x: 0, y: 0, z: 0 }): number => {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const dz = pos.z - center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  normalizeAngle: (angle: number): number => {
    let a = angle;
    while (a > 180) a -= 360;
    while (a < -180) a += 360;
    return a;
  },
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  images = [],
  containerSize = 340,
  sphereRadius = 140,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.14,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  selectedSkillId = null,
  showLabels = false,
  onSelectImage,
}) => {
  const { colors } = useTheme();

  // ==========================================
  // STATE & REFS
  // ==========================================

  const [rotation, setRotation] = useState<RotationState>({ x: 15, y: 15, z: 0 });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<React.ComponentRef<typeof View>>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const actualSphereRadius = sphereRadius || containerSize * 0.45;
  const baseImageSize = containerSize * baseImageScale;

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const imagePositions = useMemo((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;
    if (imageCount === 0) return positions;

    // Use Fibonacci sphere distribution for even coverage
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = (2 * Math.PI) / goldenRatio;

    for (let i = 0; i < imageCount; i++) {
      // Fibonacci sphere distribution
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      // Convert to degrees
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      // Better pole coverage - reach poles but avoid extreme mathematical issues
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      if (phi < 90) {
        phi = Math.max(5, phi - poleBonus);
      } else {
        phi = Math.min(175, phi + poleBonus);
      }

      // Map to fuller vertical range - covers poles but avoids extremes
      phi = 15 + (phi / 180) * 150;

      // Deterministic slight offset based on index to avoid jitter on re-renders
      const pseudoRandomA = Math.sin(i * 12.9898) * 43758.5453;
      const offsetA = (pseudoRandomA - Math.floor(pseudoRandomA) - 0.5) * 16;
      const pseudoRandomB = Math.cos(i * 78.233) * 19341.123;
      const offsetB = (pseudoRandomB - Math.floor(pseudoRandomB) - 0.5) * 8;

      theta = (theta + offsetA + 360) % 360;
      phi = Math.max(10, Math.min(170, phi + offsetB));

      positions.push({
        theta,
        phi,
        radius: actualSphereRadius,
      });
    }

    return positions;
  }, [images.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    const positions = imagePositions.map((pos, index) => {
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

      // Initial position on sphere
      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      // Apply Y-axis rotation (horizontal drag)
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      // Apply X-axis rotation (vertical drag)
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const worldPos: Position3D = { x, y, z };

      // Calculate visibility with smooth fade zones
      const fadeZoneStart = -10;
      const fadeZoneEnd = -35;
      const isVisible = worldPos.z > fadeZoneEnd;

      let fadeOpacity = 1;
      if (worldPos.z <= fadeZoneStart) {
        fadeOpacity = Math.max(0, (worldPos.z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd));
      }

      const isPoleImage = pos.phi < 30 || pos.phi > 150;

      const distanceFromCenter = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y);
      const maxDistance = actualSphereRadius;
      const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);

      const distancePenalty = isPoleImage ? 0.4 : 0.7;
      const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);

      const depthScale = (worldPos.z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      return {
        ...worldPos,
        scale,
        zIndex: Math.round(1000 + worldPos.z),
        isVisible,
        fadeOpacity,
        originalIndex: index,
      };
    });

    // Apply collision detection to prevent overlaps
    const adjustedPositions = [...positions];

    for (let i = 0; i < adjustedPositions.length; i++) {
      const pos = adjustedPositions[i]!;
      if (!pos.isVisible) continue;

      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;

      for (let j = 0; j < adjustedPositions.length; j++) {
        if (i === j) continue;

        const other = adjustedPositions[j]!;
        if (!other.isVisible) continue;

        const otherSize = baseImageSize * other.scale;
        const dx = pos.x - other.x;
        const dy = pos.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const minDistance = (imageSize + otherSize) / 2 + 18;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(0.45, 1 - (overlap / minDistance) * 0.55);
          adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
        }
      }

      adjustedPositions[i] = {
        ...pos,
        scale: Math.max(0.28, adjustedScale),
      };
    }

    return adjustedPositions;
  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);

  const clampRotationSpeed = useCallback(
    (speed: number): number => {
      return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
    },
    [maxRotationSpeed],
  );

  // ==========================================
  // PHYSICS & MOMENTUM
  // ==========================================

  const updateMomentum = useCallback(() => {
    if (isDragging) return;

    setVelocity((prev) => {
      const newVelocity = {
        x: prev.x * momentumDecay,
        y: prev.y * momentumDecay,
      };

      if (!autoRotate && Math.abs(newVelocity.x) < 0.01 && Math.abs(newVelocity.y) < 0.01) {
        return { x: 0, y: 0 };
      }

      return newVelocity;
    });

    setRotation((prev) => {
      let newY = prev.y;

      if (autoRotate) {
        newY += autoRotateSpeed;
      }

      newY += clampRotationSpeed(velocity.y);

      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)),
        y: SPHERE_MATH.normalizeAngle(newY),
        z: prev.z,
      };
    });
  }, [isDragging, momentumDecay, velocity, clampRotationSpeed, autoRotate, autoRotateSpeed]);

  // ==========================================
  // GESTURE & POINTER HANDLERS
  // ==========================================

  const applyDragDelta = useCallback(
    (deltaX: number, deltaY: number) => {
      dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);
      const rotationDelta = {
        x: -deltaY * dragSensitivity,
        y: deltaX * dragSensitivity,
      };

      setRotation((prev) => ({
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
        y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
        z: prev.z,
      }));

      setVelocity({
        x: clampRotationSpeed(rotationDelta.x),
        y: clampRotationSpeed(rotationDelta.y),
      });
    },
    [dragSensitivity, clampRotationSpeed],
  );

  const handleResponderGrant = useCallback((evt: GestureResponderEvent) => {
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    dragDistanceRef.current = 0;
    lastMousePos.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
  }, []);

  const handleResponderMove = useCallback(
    (evt: GestureResponderEvent) => {
      if (!isDragging) return;
      const currentX = evt.nativeEvent.pageX;
      const currentY = evt.nativeEvent.pageY;
      const deltaX = currentX - lastMousePos.current.x;
      const deltaY = currentY - lastMousePos.current.y;
      applyDragDelta(deltaX, deltaY);
      lastMousePos.current = { x: currentX, y: currentY };
    },
    [isDragging, applyDragDelta],
  );

  const handleResponderRelease = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ==========================================
  // EFFECTS & LIFECYCLE
  // ==========================================

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [updateMomentum]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const worldPositions = calculateWorldPositions();

  // Sort visible nodes back-to-front so z-ordering is consistent on both native & web
  const sortedIndices = useMemo(() => {
    return worldPositions
      .map((pos, idx) => ({ pos, idx }))
      .filter((item) => item.pos.isVisible)
      .sort((a, b) => a.pos.zIndex - b.pos.zIndex)
      .map((item) => item.idx);
  }, [worldPositions]);

  const handleNodePress = useCallback(
    (image: ImageData) => {
      // Ignore press if the user was dragging the sphere
      if (dragDistanceRef.current > 10) {
        dragDistanceRef.current = 0;
        return;
      }
      onSelectImage?.(image);
      setSelectedImage(image);
    },
    [onSelectImage],
  );

  const renderImageNode = useCallback(
    (index: number) => {
      const image = images[index];
      const position = worldPositions[index];

      if (!image || !position || !position.isVisible) return null;

      const imageSize = baseImageSize * position.scale;
      const isHovered = hoveredIndex === index;
      const isSelected = Boolean(
        selectedSkillId && (image.skillId === selectedSkillId || image.id === selectedSkillId),
      );
      const finalScale = isHovered
        ? Math.min(hoverScale, hoverScale / position.scale)
        : isSelected
          ? 1.12
          : 1;
      const ringColor = image.color ?? (isSelected ? colors.primary : 'rgba(255,255,255,0.45)');

      return (
        <Pressable
          key={image.id}
          accessibilityRole="button"
          accessibilityLabel={image.title ?? image.alt}
          onHoverIn={() => setHoveredIndex(index)}
          onHoverOut={() => setHoveredIndex(null)}
          onPress={() => handleNodePress(image)}
          style={[
            styles.nodeContainer,
            {
              width: imageSize,
              height: imageSize,
              left: containerSize / 2 + position.x - imageSize / 2,
              top: containerSize / 2 + position.y - imageSize / 2,
              opacity: position.fadeOpacity,
              zIndex: position.zIndex,
              transform: [{ scale: finalScale }],
            },
          ]}
        >
          <View
            style={[
              styles.nodeCircle,
              {
                borderColor: ringColor,
                borderWidth: isSelected ? 3 : 2,
              },
            ]}
          >
            <Image
              source={{ uri: image.src }}
              accessibilityLabel={image.alt}
              style={styles.nodeImage}
              resizeMode="cover"
            />
          </View>
          {showLabels && image.title && position.z > 0 ? (
            <View
              style={[
                styles.nodeLabelPill,
                {
                  backgroundColor: isSelected ? image.color ?? colors.primary : 'rgba(11, 13, 23, 0.82)',
                },
              ]}
            >
              <Text style={styles.nodeLabelText} numberOfLines={1}>
                {image.title}
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    },
    [
      images,
      worldPositions,
      baseImageSize,
      hoveredIndex,
      selectedSkillId,
      hoverScale,
      colors.primary,
      containerSize,
      showLabels,
      handleNodePress,
    ],
  );

  const renderSpotlightModal = () => {
    if (!selectedImage) return null;

    return (
      <Modal
        visible={Boolean(selectedImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedImage(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: selectedImage.src }}
                accessibilityLabel={selectedImage.alt}
                style={styles.modalImage}
                resizeMode="cover"
              />
              {selectedImage.badge ? (
                <View
                  style={[
                    styles.modalBadge,
                    { backgroundColor: selectedImage.color ?? colors.primary },
                  ]}
                >
                  <Text style={styles.modalBadgeText}>{selectedImage.badge}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => setSelectedImage(null)}
                accessibilityRole="button"
                accessibilityLabel="Close spotlight modal"
                style={styles.closeButton}
              >
                <Icon name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            {(selectedImage.title || selectedImage.description || selectedImage.onAction) && (
              <View style={styles.modalContent}>
                {selectedImage.title ? (
                  <Text style={[styles.modalTitle, { color: colors.ink }]}>{selectedImage.title}</Text>
                ) : null}
                {selectedImage.description ? (
                  <Text style={[styles.modalDescription, { color: colors.muted }]}>
                    {selectedImage.description}
                  </Text>
                ) : null}
                {selectedImage.onAction && selectedImage.actionLabel ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={selectedImage.actionLabel}
                    onPress={() => {
                      const action = selectedImage.onAction;
                      setSelectedImage(null);
                      action?.();
                    }}
                    style={[
                      styles.modalActionBtn,
                      { backgroundColor: selectedImage.color ?? colors.primary },
                    ]}
                  >
                    <Text style={styles.modalActionText}>{selectedImage.actionLabel}</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  // ==========================================
  // EARLY RETURNS
  // ==========================================

  if (!images.length) {
    return (
      <View
        style={[
          styles.emptyBox,
          {
            width: containerSize,
            height: containerSize,
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: colors.muted }]}>No images provided</Text>
        <Text style={[styles.emptySub, { color: colors.muted }]}>Add images to the images prop</Text>
      </View>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <>
      <View
        ref={containerRef}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleResponderGrant}
        onResponderMove={handleResponderMove}
        onResponderRelease={handleResponderRelease}
        onResponderTerminate={handleResponderRelease}
        style={[
          styles.sphereContainer,
          {
            width: containerSize,
            height: containerSize,
          },
          Platform.OS === 'web' ? ({ perspective: `${perspective}px`, cursor: isDragging ? 'grabbing' : 'grab' } as object) : null,
        ]}
      >
        <View style={styles.sphereInner}>
          {sortedIndices.map((index) => renderImageNode(index))}
        </View>
      </View>

      {renderSpotlightModal()}
    </>
  );
};

const styles = StyleSheet.create({
  sphereContainer: {
    position: 'relative',
    alignSelf: 'center',
    userSelect: 'none',
  },
  sphereInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#14162B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },
  nodeImage: {
    width: '100%',
    height: '100%',
  },
  nodeLabelPill: {
    position: 'absolute',
    bottom: -14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: 96,
  },
  nodeLabelText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    textAlign: 'center',
  },
  placeholderBox: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  placeholderText: {
    fontFamily: fonts.body,
    fontSize: 14,
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#0B0D17',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 18,
    gap: 6,
  },
  modalTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: 21,
  },
  modalDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActionBtn: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});

export default SphereImageGrid;
