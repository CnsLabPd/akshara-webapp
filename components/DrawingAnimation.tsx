'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { parseGIF, decompressFrames } from 'gifuct-js';

interface DrawingAnimationProps {
  character: string;
  isVisible: boolean;
  onClose: () => void;
}

// Map of characters that have GIF animations with their playback speed multiplier
const GIF_ANIMATIONS: Record<string, { path: string; speed: number }> = {
  'a': { path: '/images/Animated_letter_a_lower_case.gif', speed: 2.5 }, // 2.5x faster
  'g': { path: '/images/Animated_letter_g_lower_case.gif', speed: 2.5 }, // 2.5x faster
};

export default function DrawingAnimation({ character, isVisible, onClose }: DrawingAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gifCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const gifFramesRef = useRef<any[]>([]);
  const gifAnimationRef = useRef<number | null>(null);
  const [isGifLoaded, setIsGifLoaded] = useState(false);
  const [animationCount, setAnimationCount] = useState(0);

  // SVG path data for stroke-order animations
  // These paths are designed to match Tesseract's expected character shapes
  const getCharacterPaths = (char: string): { path: string; delay: number }[] => {

    // Capital Letters - Optimized for Tesseract recognition
    const capitalPaths: Record<string, { path: string; delay: number }[]> = {
      'A': [
        { path: 'M100,180 L150,60', delay: 0 },      // Left diagonal
        { path: 'M150,60 L200,180', delay: 300 },    // Right diagonal
        { path: 'M120,130 L180,130', delay: 600 }    // Crossbar
      ],
      'B': [
        { path: 'M100,60 L100,180', delay: 0 },      // Vertical line
        { path: 'M100,60 Q170,60 170,95 Q170,120 100,120', delay: 300 }, // Top bump
        { path: 'M100,120 Q180,120 180,155 Q180,180 100,180', delay: 600 } // Bottom bump
      ],
      'C': [
        { path: 'M180,80 Q100,60 100,120 Q100,180 180,160', delay: 0 }
      ],
      'D': [
        { path: 'M100,60 L100,180', delay: 0 },
        { path: 'M100,60 Q200,80 200,120 Q200,160 100,180', delay: 300 }
      ],
      'E': [
        { path: 'M180,60 L100,60', delay: 0 },
        { path: 'M100,60 L100,180', delay: 300 },
        { path: 'M100,120 L170,120', delay: 600 },
        { path: 'M100,180 L180,180', delay: 900 }
      ],
      'F': [
        { path: 'M100,180 L100,60', delay: 0 },
        { path: 'M100,60 L180,60', delay: 300 },
        { path: 'M100,120 L170,120', delay: 600 }
      ],
      'G': [
        { path: 'M180,80 Q100,60 100,120 Q100,180 150,180', delay: 0 },
        { path: 'M150,180 L180,180 L180,130', delay: 300 }
      ],
      'H': [
        { path: 'M100,60 L100,180', delay: 0 },
        { path: 'M190,60 L190,180', delay: 300 },
        { path: 'M100,120 L190,120', delay: 600 }
      ],
      'I': [
        { path: 'M120,60 L180,60', delay: 0 },
        { path: 'M150,60 L150,180', delay: 300 },
        { path: 'M120,180 L180,180', delay: 600 }
      ],
      'J': [
        { path: 'M120,60 L180,60', delay: 0 },
        { path: 'M150,60 L150,160 Q150,180 120,180', delay: 300 }
      ],
      'K': [
        { path: 'M100,60 L100,180', delay: 0 },
        { path: 'M190,60 L100,110', delay: 300 },
        { path: 'M100,110 L190,180', delay: 600 }
      ],
      'L': [
        { path: 'M100,60 L100,180', delay: 0 },
        { path: 'M100,180 L180,180', delay: 300 }
      ],
      'M': [
        { path: 'M90,180 L90,60', delay: 0 },
        { path: 'M90,60 L150,120', delay: 300 },
        { path: 'M150,120 L210,60', delay: 600 },
        { path: 'M210,60 L210,180', delay: 900 }
      ],
      'N': [
        { path: 'M100,180 L100,60', delay: 0 },
        { path: 'M100,60 L190,180', delay: 300 },
        { path: 'M190,180 L190,60', delay: 600 }
      ],
      'O': [
        { path: 'M150,60 Q100,60 100,120 Q100,180 150,180 Q200,180 200,120 Q200,60 150,60', delay: 0 }
      ],
      'P': [
        { path: 'M100,180 L100,60', delay: 0 },
        { path: 'M100,60 Q180,60 180,100 Q180,130 100,130', delay: 300 }
      ],
      'Q': [
        { path: 'M150,60 Q100,60 100,120 Q100,180 150,180 Q200,180 200,120 Q200,60 150,60', delay: 0 },
        { path: 'M170,160 L200,190', delay: 300 }
      ],
      'R': [
        { path: 'M100,180 L100,60', delay: 0 },
        { path: 'M100,60 Q180,60 180,100 Q180,120 100,120', delay: 300 },
        { path: 'M100,120 L190,180', delay: 600 }
      ],
      'S': [
        { path: 'M180,80 Q100,60 100,90 Q100,110 150,120 Q200,130 200,160 Q200,180 120,180', delay: 0 }
      ],
      'T': [
        { path: 'M100,60 L200,60', delay: 0 },
        { path: 'M150,60 L150,180', delay: 300 }
      ],
      'U': [
        { path: 'M100,60 L100,160 Q100,180 150,180 Q200,180 200,160 L200,60', delay: 0 }
      ],
      'V': [
        { path: 'M100,60 L150,180', delay: 0 },
        { path: 'M150,180 L200,60', delay: 300 }
      ],
      'W': [
        { path: 'M90,60 L110,180', delay: 0 },
        { path: 'M110,180 L150,120', delay: 300 },
        { path: 'M150,120 L190,180', delay: 600 },
        { path: 'M190,180 L210,60', delay: 900 }
      ],
      'X': [
        { path: 'M100,60 L200,180', delay: 0 },
        { path: 'M200,60 L100,180', delay: 300 }
      ],
      'Y': [
        { path: 'M100,60 L150,120', delay: 0 },
        { path: 'M200,60 L150,120', delay: 300 },
        { path: 'M150,120 L150,180', delay: 600 }
      ],
      'Z': [
        { path: 'M100,60 L200,60', delay: 0 },
        { path: 'M200,60 L100,180', delay: 300 },
        { path: 'M100,180 L200,180', delay: 600 }
      ]
    };

    // Small letters - Optimized for Tesseract recognition
    const smallPaths: Record<string, { path: string; delay: number }[]> = {
      'a': [
        { path: 'M180,110 Q180,90 150,90 Q120,90 120,120 Q120,150 150,150 Q180,150 180,120 Q180,140 185,150 Q188,160 190,170', delay: 0 }
      ],
      'b': [
        { path: 'M110,60 L110,170', delay: 0 },
        { path: 'M110,110 Q110,90 140,90 Q180,90 180,130 Q180,170 140,170 Q110,170 110,150', delay: 300 }
      ],
      'c': [
        { path: 'M180,100 Q150,90 130,100 Q110,110 110,130 Q110,150 130,160 Q150,170 180,160', delay: 0 }
      ],
      'd': [
        { path: 'M180,60 L180,170', delay: 0 },
        { path: 'M180,110 Q180,90 150,90 Q110,90 110,130 Q110,170 150,170 Q180,170 180,150', delay: 300 }
      ],
      'e': [
        { path: 'M110,130 L180,130 Q180,90 150,90 Q110,90 110,130 Q110,170 150,170 Q180,170 180,150', delay: 0 }
      ],
      'f': [
        { path: 'M170,60 Q150,60 150,80 L150,170', delay: 0 },
        { path: 'M120,110 L180,110', delay: 300 }
      ],
      'g': [
        { path: 'M180,110 Q180,90 150,90 Q110,90 110,130 Q110,160 150,160 Q180,160 180,130 L180,180 Q180,200 150,200', delay: 0 }
      ],
      'h': [
        { path: 'M110,60 L110,170', delay: 0 },
        { path: 'M110,110 Q110,90 140,90 Q180,90 180,120 L180,170', delay: 300 }
      ],
      'i': [
        { path: 'M145,70 L145,75', delay: 0 },
        { path: 'M145,95 L145,170', delay: 300 }
      ],
      'j': [
        { path: 'M155,70 L155,75', delay: 0 },
        { path: 'M155,95 L155,180 Q155,200 135,200', delay: 300 }
      ],
      'k': [
        { path: 'M110,60 L110,170', delay: 0 },
        { path: 'M170,90 L110,130', delay: 300 },
        { path: 'M110,130 L170,170', delay: 600 }
      ],
      'l': [
        { path: 'M145,60 L145,170', delay: 0 }
      ],
      'm': [
        { path: 'M100,170 L100,95', delay: 0 },
        { path: 'M100,110 Q100,90 120,90 Q140,90 140,110 L140,170', delay: 300 },
        { path: 'M140,110 Q140,90 160,90 Q180,90 180,110 L180,170', delay: 600 }
      ],
      'n': [
        { path: 'M110,170 L110,95', delay: 0 },
        { path: 'M110,110 Q110,90 140,90 Q180,90 180,120 L180,170', delay: 300 }
      ],
      'o': [
        { path: 'M145,90 Q110,90 110,130 Q110,170 145,170 Q180,170 180,130 Q180,90 145,90', delay: 0 }
      ],
      'p': [
        { path: 'M110,95 L110,200', delay: 0 },
        { path: 'M110,110 Q110,90 140,90 Q180,90 180,130 Q180,170 140,170 Q110,170 110,150', delay: 300 }
      ],
      'q': [
        { path: 'M180,95 L180,200', delay: 0 },
        { path: 'M180,110 Q180,90 150,90 Q110,90 110,130 Q110,170 150,170 Q180,170 180,150', delay: 300 }
      ],
      'r': [
        { path: 'M110,170 L110,95', delay: 0 },
        { path: 'M110,110 Q110,90 140,90 Q170,90 170,100', delay: 300 }
      ],
      's': [
        { path: 'M170,100 Q120,90 120,110 Q120,120 145,130 Q170,140 170,160 Q170,170 120,170', delay: 0 }
      ],
      't': [
        { path: 'M140,70 L140,160 Q140,170 160,170', delay: 0 },
        { path: 'M120,95 L170,95', delay: 300 }
      ],
      'u': [
        { path: 'M110,95 L110,150 Q110,170 140,170 Q180,170 180,150 L180,95', delay: 0 }
      ],
      'v': [
        { path: 'M110,95 L145,170', delay: 0 },
        { path: 'M145,170 L180,95', delay: 300 }
      ],
      'w': [
        { path: 'M100,95 L115,170', delay: 0 },
        { path: 'M115,170 L145,130', delay: 300 },
        { path: 'M145,130 L175,170', delay: 600 },
        { path: 'M175,170 L190,95', delay: 900 }
      ],
      'x': [
        { path: 'M110,95 L180,170', delay: 0 },
        { path: 'M180,95 L110,170', delay: 300 }
      ],
      'y': [
        { path: 'M110,95 L145,150', delay: 0 },
        { path: 'M180,95 L145,150 L145,190 Q145,200 125,200', delay: 300 }
      ],
      'z': [
        { path: 'M110,95 L180,95', delay: 0 },
        { path: 'M180,95 L110,170', delay: 300 },
        { path: 'M110,170 L180,170', delay: 600 }
      ]
    };

    // Numbers - Optimized for Tesseract recognition
    const numberPaths: Record<string, { path: string; delay: number }[]> = {
      '0': [
        { path: 'M150,60 Q100,60 100,120 Q100,180 150,180 Q200,180 200,120 Q200,60 150,60', delay: 0 }
      ],
      '1': [
        { path: 'M130,80 L150,60 L150,180', delay: 0 }
      ],
      '2': [
        { path: 'M110,80 Q110,60 150,60 Q190,60 190,90 Q190,110 110,170 L190,170', delay: 0 }
      ],
      '3': [
        { path: 'M110,70 Q110,60 150,60 Q190,60 190,90 Q190,110 150,110', delay: 0 },
        { path: 'M150,110 Q190,110 190,150 Q190,180 150,180 Q110,180 110,170', delay: 300 }
      ],
      '4': [
        { path: 'M170,60 L110,140 L190,140', delay: 0 },
        { path: 'M170,60 L170,180', delay: 300 }
      ],
      '5': [
        { path: 'M180,60 L110,60 L110,110 Q140,100 170,110 Q190,120 190,150 Q190,180 150,180 Q110,180 110,165', delay: 0 }
      ],
      '6': [
        { path: 'M170,70 Q120,60 110,100 L110,150 Q110,180 150,180 Q190,180 190,140 Q190,110 150,110 Q110,110 110,130', delay: 0 }
      ],
      '7': [
        { path: 'M110,60 L190,60 L130,180', delay: 0 }
      ],
      '8': [
        { path: 'M150,60 Q110,60 110,85 Q110,110 150,110 Q190,110 190,85 Q190,60 150,60', delay: 0 },
        { path: 'M150,110 Q110,110 110,145 Q110,180 150,180 Q190,180 190,145 Q190,110 150,110', delay: 300 }
      ],
      '9': [
        { path: 'M190,90 Q190,60 150,60 Q110,60 110,90 Q110,120 150,120 Q190,120 190,150 L190,170 Q180,180 150,170', delay: 0 }
      ]
    };

    // Tamil vowels - Traditional stroke order
    const tamilVowelPaths: Record<string, { path: string; delay: number }[]> = {
      'அ': [
        { path: 'M100,120 Q150,80 200,120', delay: 0 },
        { path: 'M150,120 L150,170', delay: 300 }
      ],
      'ஆ': [
        { path: 'M100,120 Q150,80 200,120', delay: 0 },
        { path: 'M150,120 L150,170', delay: 300 },
        { path: 'M170,90 Q190,80 210,90 Q220,100 210,110 Q190,120 170,110', delay: 600 }
      ],
      'இ': [
        { path: 'M120,90 Q100,70 80,90 Q100,110 120,90', delay: 0 },
        { path: 'M120,90 L170,90 L170,170', delay: 300 }
      ],
      'ஈ': [
        { path: 'M120,90 Q100,70 80,90 Q100,110 120,90', delay: 0 },
        { path: 'M120,90 L170,90 L170,170', delay: 300 },
        { path: 'M190,70 Q210,60 230,70 Q240,80 230,90 Q210,100 190,90', delay: 600 }
      ],
      'உ': [
        { path: 'M120,120 Q150,90 180,120 Q180,150 150,170 Q120,150 120,120', delay: 0 },
        { path: 'M150,120 L150,190', delay: 300 }
      ],
      'ஊ': [
        { path: 'M120,120 Q150,90 180,120 Q180,150 150,170 Q120,150 120,120', delay: 0 },
        { path: 'M150,120 L150,190', delay: 300 },
        { path: 'M200,100 Q220,90 240,100 Q250,110 240,120 Q220,130 200,120', delay: 600 }
      ],
      'எ': [
        { path: 'M150,80 Q180,60 210,80 Q190,100 160,120 Q130,100 150,80', delay: 0 },
        { path: 'M160,120 L160,170', delay: 300 }
      ],
      'ஏ': [
        { path: 'M150,80 Q180,60 210,80 Q190,100 160,120 Q130,100 150,80', delay: 0 },
        { path: 'M160,120 L160,170', delay: 300 },
        { path: 'M230,60 Q250,50 270,60 Q280,70 270,80 Q250,90 230,80', delay: 600 }
      ],
      'ஐ': [
        { path: 'M120,90 Q100,70 80,90 Q100,110 120,90', delay: 0 },
        { path: 'M150,80 Q180,60 210,80 Q190,100 160,120 Q130,100 150,80', delay: 300 },
        { path: 'M160,120 L160,170', delay: 600 }
      ],
      'ஒ': [
        { path: 'M130,120 Q160,90 190,120 Q160,150 130,120', delay: 0 },
        { path: 'M100,80 Q80,70 60,80 Q80,90 100,80', delay: 300 },
        { path: 'M160,120 L160,170', delay: 600 }
      ],
      'ஓ': [
        { path: 'M130,120 Q160,90 190,120 Q160,150 130,120', delay: 0 },
        { path: 'M100,80 Q80,70 60,80 Q80,90 100,80', delay: 300 },
        { path: 'M160,120 L160,170', delay: 600 },
        { path: 'M210,60 Q230,50 250,60 Q260,70 250,80 Q230,90 210,80', delay: 900 }
      ],
      'ஔ': [
        { path: 'M100,80 Q80,70 60,80 Q80,90 100,80', delay: 0 },
        { path: 'M130,120 Q160,90 190,120 Q160,150 130,120', delay: 300 },
        { path: 'M150,80 Q180,60 210,80 Q190,100 160,120 Q130,100 150,80', delay: 600 },
        { path: 'M160,120 L160,170', delay: 900 }
      ]
    };

    // Check for Tamil vowel first
    if (tamilVowelPaths[char]) {
      return tamilVowelPaths[char];
    }

    // Check if it's a number first
    if (numberPaths[char]) {
      return numberPaths[char];
    }

    // Check if character is uppercase or lowercase
    const isUpperCase = char === char.toUpperCase() && char !== char.toLowerCase();
    const isLowerCase = char === char.toLowerCase() && char !== char.toUpperCase();

    // If it's uppercase, use capital letter paths
    if (isUpperCase && capitalPaths[char]) {
      return capitalPaths[char];
    }

    // If it's lowercase, use small letter paths
    if (isLowerCase && smallPaths[char]) {
      return smallPaths[char];
    }

    // Default fallback
    return [{ path: 'M150,120 L150,120', delay: 0 }];
  };

  const parsePath = (pathString: string): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const commands = pathString.split(/(?=[MLQqCc])/);

    let currentX = 0;
    let currentY = 0;

    commands.forEach(cmd => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      const type = trimmed[0];
      const coords = trimmed.slice(1).trim().split(/[\s,]+/).map(Number);

      if (type === 'M') {
        currentX = coords[0];
        currentY = coords[1];
        points.push({ x: currentX, y: currentY });
      } else if (type === 'L') {
        // Interpolate straight lines - speed optimized (1.2x faster)
        const endX = coords[0];
        const endY = coords[1];
        const steps = 25; // Reduced from 30 (1.2x faster)

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = currentX + (endX - currentX) * t;
          const y = currentY + (endY - currentY) * t;
          points.push({ x, y });
        }

        currentX = endX;
        currentY = endY;
      } else if (type === 'Q') {
        // Quadratic Bezier curve - speed optimized (1.87x faster total - additional 1.3x boost)
        const cp1x = coords[0];
        const cp1y = coords[1];
        const endX = coords[2];
        const endY = coords[3];

        for (let t = 0; t <= 1; t += 0.056) {
          const x = (1 - t) * (1 - t) * currentX + 2 * (1 - t) * t * cp1x + t * t * endX;
          const y = (1 - t) * (1 - t) * currentY + 2 * (1 - t) * t * cp1y + t * t * endY;
          points.push({ x, y });
        }

        currentX = endX;
        currentY = endY;
      }
    });

    return points;
  };

  const animateDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and reset state for new animation
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guide lines for small letters
    const isLowerCase = character === character.toLowerCase() && character !== character.toUpperCase();
    const isTamilVowel = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'].includes(character);
    
    if (isLowerCase) {
      // Draw baseline (where letters sit)
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(80, 170);
      ctx.lineTo(220, 170);
      ctx.stroke();

      // Draw x-height line (top of lowercase letters like a, e, o)
      ctx.beginPath();
      ctx.moveTo(80, 95);
      ctx.lineTo(220, 95);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isTamilVowel) {
      // Draw Tamil vowel guide lines
      ctx.strokeStyle = '#FFE6CC';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      
      // Center horizontal line
      ctx.beginPath();
      ctx.moveTo(50, 120);
      ctx.lineTo(250, 120);
      ctx.stroke();
      
      // Center vertical line
      ctx.beginPath();
      ctx.moveTo(150, 50);
      ctx.lineTo(150, 190);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }

    // Set drawing style for better Tesseract recognition
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const paths = getCharacterPaths(character);
    let currentPathIndex = 0;
    let currentPointIndex = 0;
    let allPoints: { x: number; y: number }[][] = paths.map(p => parsePath(p.path));

    const startTime = Date.now();
    let frameCounter = 0;
    const framesPerPoint = 4; // Draw one point every 4 frames (medium speed)
    const delayMultiplier = 1.5; // 1.5x delay between strokes for better visibility

    const animate = () => {
      if (currentPathIndex >= paths.length) {
        setIsPlaying(false);
        // Start continuous loop after 1 second delay
        setTimeout(() => {
          if (isVisible) {
            setAnimationCount(prev => prev + 1);
            animateDrawing();
          }
        }, 1000);
        return;
      }

      const elapsed = Date.now() - startTime;
      const currentDelay = paths[currentPathIndex].delay * delayMultiplier;

      if (elapsed < currentDelay) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const points = allPoints[currentPathIndex];

      if (currentPointIndex === 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
      }

      // Slow down animation by only drawing every few frames
      frameCounter++;
      if (frameCounter >= framesPerPoint) {
        frameCounter = 0;

        if (currentPointIndex < points.length) {
          const point = points[currentPointIndex];
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          currentPointIndex++;
        } else {
          currentPathIndex++;
          currentPointIndex = 0;
        }
      }

      if (currentPointIndex < points.length || currentPathIndex < paths.length) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    setIsPlaying(true);
    animate();
  };

  const handlePlay = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAnimationCount(0);
    animateDrawing();
  };

  // Load and parse GIF file
  const loadGif = async (gifPath: string) => {
    try {
      const response = await fetch(gifPath);
      const arrayBuffer = await response.arrayBuffer();
      const gif = parseGIF(arrayBuffer);
      const frames = decompressFrames(gif, true);
      gifFramesRef.current = frames;
      setIsGifLoaded(true);

      // Auto-play GIF when loaded
      playGif();
    } catch (error) {
      console.error('Error loading GIF:', error);
    }
  };

  // Play GIF with custom speed - continuous loop
  const playGif = () => {
    const canvas = gifCanvasRef.current;
    if (!canvas || gifFramesRef.current.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames = gifFramesRef.current;
    const gifConfig = GIF_ANIMATIONS[character];
    const speedMultiplier = gifConfig?.speed || 1;

    let frameIndex = 0;
    let lastFrameTime = Date.now();

    const renderFrame = () => {
      if (!isVisible) return; // Stop if modal is closed
      
      const currentTime = Date.now();
      const frame = frames[frameIndex];

      // Calculate delay with speed multiplier (divide by speed to make it faster)
      const frameDelay = (frame.delay || 100) / speedMultiplier;

      if (currentTime - lastFrameTime >= frameDelay) {
        // Create temporary canvas for the frame
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCanvas.width = frame.dims.width;
          tempCanvas.height = frame.dims.height;

          // Create ImageData from frame
          const imageData = new ImageData(
            new Uint8ClampedArray(frame.patch),
            frame.dims.width,
            frame.dims.height
          );

          tempCtx.putImageData(imageData, 0, 0);

          // Clear canvas and draw frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            tempCanvas,
            frame.dims.left,
            frame.dims.top,
            frame.dims.width,
            frame.dims.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        frameIndex = (frameIndex + 1) % frames.length;
        lastFrameTime = currentTime;
      }

      gifAnimationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  // Load GIF when component mounts and character changes
  useEffect(() => {
    const gifConfig = GIF_ANIMATIONS[character];
    if (gifConfig && isVisible) {
      setIsGifLoaded(false);
      // Clear any existing GIF animation
      if (gifAnimationRef.current) {
        cancelAnimationFrame(gifAnimationRef.current);
        gifAnimationRef.current = null;
      }
      gifFramesRef.current = [];
      loadGif(gifConfig.path);
    }

    return () => {
      if (gifAnimationRef.current) {
        cancelAnimationFrame(gifAnimationRef.current);
        gifAnimationRef.current = null;
      }
    };
  }, [character, isVisible]);

  // Auto-start animation when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      // Reset animation state for new character
      setIsPlaying(false);
      setAnimationCount(0);
      
      // Auto-start animation if no GIF is available
      const gifConfig = GIF_ANIMATIONS[character];
      if (!gifConfig) {
        setTimeout(() => {
          handlePlay();
        }, 100); // Small delay to ensure canvas is ready
      }
    }

    return () => {
      // Clean up all animations when modal closes or character changes
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (gifAnimationRef.current) {
        cancelAnimationFrame(gifAnimationRef.current);
        gifAnimationRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [isVisible, character]);

  if (!isVisible) return null;

  // Determine character type for display
  const isNumber = /\d/.test(character);
  const isUpperCase = character === character.toUpperCase() && character !== character.toLowerCase();
  const isLowerCase = character === character.toLowerCase() && character !== character.toUpperCase();
  const isTamilVowel = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'].includes(character);

  let characterType = '';
  if (isNumber) {
    characterType = 'Number';
  } else if (isTamilVowel) {
    characterType = 'Tamil Vowel';
  } else if (isUpperCase) {
    characterType = 'Capital Letter';
  } else if (isLowerCase) {
    characterType = 'Small Letter';
  }

  // Check if this character has a GIF animation
  const gifConfig = GIF_ANIMATIONS[character];
  const hasGifAnimation = !!gifConfig;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              How to Write: <span className="text-blue-600">{character}</span>
            </h2>
            {characterType && (
              <p className="text-sm text-gray-500 mt-1">{characterType}</p>
            )}
            {hasGifAnimation && (
              <p className="text-xs text-green-600 mt-1">
                ⚡ Playing at {gifConfig.speed}x speed
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-center items-center">
          {hasGifAnimation ? (
            /* Display GIF Animation on Canvas with speed control */
            <div className="relative w-[300px] h-[240px] flex items-center justify-center">
              {!isGifLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                </div>
              )}
              <canvas
                ref={gifCanvasRef}
                width={300}
                height={240}
                className="border-2 border-gray-300 rounded bg-white"
              />
            </div>
          ) : (
            /* Display Canvas Animation */
            <canvas
              ref={canvasRef}
              width={300}
              height={240}
              className="border-2 border-gray-300 rounded bg-white"
            />
          )}
        </div>

        {hasGifAnimation ? (
          /* GIF Animation Controls */
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              Close
            </button>
          </div>
        ) : (
          /* Canvas Animation Controls - Auto-playing */
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              Close
            </button>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Tip:</strong> {
              hasGifAnimation 
                ? 'Watch the continuous sped-up animation to learn how to write this letter correctly.'
                : isTamilVowel
                ? 'Follow the stroke order for Tamil vowels. The dotted guidelines help position the curves and strokes correctly. Tamil writing flows with curved forms.'
                : 'The animation plays continuously. Follow it carefully and write slowly and clearly for best recognition results.'
            }
          </p>
          {!hasGifAnimation && animationCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Animation loop: {animationCount + 1}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
