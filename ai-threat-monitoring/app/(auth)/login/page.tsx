'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { ShieldAlert, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const threeMountRef = useRef<HTMLDivElement>(null);

  // Auth Form States
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('admin_security');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Setup Three.js Laser Cyber Grid on left screen
  useEffect(() => {
    const mount = threeMountRef.current;
    if (!mount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 1. Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(60, 40, 0xd70018, 0x1e293b);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // 2. Animated Laser Scan Plane
    const laserPlaneGeo = new THREE.PlaneGeometry(60, 2);
    const laserMaterial = new THREE.MeshBasicMaterial({
      color: 0xd70018,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const laserPlane = new THREE.Mesh(laserPlaneGeo, laserMaterial);
    laserPlane.rotation.x = Math.PI / 2;
    laserPlane.position.y = -3.8;
    scene.add(laserPlane);

    // 3. Central Wireframe Security Node (Icosahedron)
    const nodeGeo = new THREE.IcosahedronGeometry(7, 1);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0xd70018,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const securityNode = new THREE.Mesh(nodeGeo, nodeMat);
    securityNode.position.set(0, 4, 0);
    scene.add(securityNode);

    // Inner Glowing Core
    const coreGeo = new THREE.SphereGeometry(3, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xff3b4e,
      wireframe: false,
    });
    const coreNode = new THREE.Mesh(coreGeo, coreMat);
    securityNode.add(coreNode);

    // 4. Floating Data Particles
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.25,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    const particleCloud = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleCloud);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate Security Node
      securityNode.rotation.y = elapsedTime * 0.35;
      securityNode.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2;

      // Laser sweep back and forth along Z
      laserPlane.position.z = Math.sin(elapsedTime * 1.5) * 22;

      // Subtle particle float
      particleCloud.rotation.y = elapsedTime * 0.05;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F4F6F8]">
      {/* LEFT COLUMN: Three.js 3D Cyber Security Space (60%) */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-[#0a0d14] overflow-hidden flex-col justify-between p-12">
        {/* Three.js Canvas Container */}
        <div ref={threeMountRef} className="absolute inset-0 z-0 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-red flex items-center justify-center text-white shadow-lg shadow-brand-red/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="text-white text-2xl font-black tracking-tight">
              SENTINEL <span className="text-brand-red">AI</span>
            </div>
            <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">
              Intelligent Threat & Behavior Surveillance System
            </p>
          </div>
        </div>

        {/* Center Poster Headline */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-red-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
            Hệ Thống Giám Sát An Ninh Cấp Doanh Nghiệp
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            Phân Tích Hành Vi & Đánh Giá Nguy Cơ Thời Gian Thực.
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Nền tảng giám sát thông minh thế hệ mới kết hợp <strong>YOLOv3 Object Detection</strong>, <strong>Lightweight OpenPose 18 khớp</strong> và mô hình đa phương thức <strong>Google Gemini 2.5 Flash</strong>.
          </p>
        </div>

        {/* Feature Badges Footer */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-gray-800/80 pt-6">
          <div className="space-y-1">
            <div className="text-white text-sm font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-red" />
              YOLOv3 + OpenPose
            </div>
            <p className="text-[11px] text-gray-500">Phát hiện người & khớp cử chỉ 30 FPS</p>
          </div>
          <div className="space-y-1">
            <div className="text-white text-sm font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-red" />
              Virtual Fence (ROI)
            </div>
            <p className="text-[11px] text-gray-500">Vùng cấm đa giác tức thì</p>
          </div>
          <div className="space-y-1">
            <div className="text-white text-sm font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-red" />
              AI Threat Meter
            </div>
            <p className="text-[11px] text-gray-500">Thang đo nguy cơ 0 - 100% tự động</p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Split-layout Login Form (40%) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-7">
          {/* Header Mobile Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex lg:hidden w-12 h-12 rounded-2xl bg-brand-red items-center justify-center text-white mb-2 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Đăng Nhập Quản Trị
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Chọn vai trò phân quyền để đăng nhập vào phòng điều hành
            </p>
          </div>

          {/* Role Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Chọn vai trò quyền hạn:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'admin' as UserRole, label: 'Quản Trị Viên', desc: 'Toàn quyền' },
                { role: 'operator' as UserRole, label: 'Vận Hành', desc: 'Giám sát trực' },
                { role: 'demo' as UserRole, label: 'Demo Khách', desc: 'Chỉ xem' },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(item.role);
                    if (item.role === 'admin') setUsername('admin_security');
                    if (item.role === 'operator') setUsername('operator_camera');
                    if (item.role === 'demo') setUsername('demo_viewer');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === item.role
                      ? 'bg-red-50 text-brand-red border-brand-red font-bold shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Tên người dùng / Email:</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-red font-medium transition-colors bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Mật mã xác thực:</label>
                <a href="#" className="text-[11px] text-brand-red hover:underline font-medium">
                  Quên mật mã?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-red font-medium transition-colors bg-white text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span>Duy trì đăng nhập trong 24 giờ</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-red hover:bg-brand-darkRed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-red/30 active:scale-98 disabled:opacity-70"
            >
              {isLoading ? (
                <span>Đang kết nối trung tâm an ninh...</span>
              ) : (
                <>
                  <span>Vào Phòng Điều Hành Giám Sát</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="p-3 bg-[#F4F6F8] rounded-2xl border border-gray-200 text-center">
            <p className="text-[11px] text-gray-600">
              Khách tham quan đồ án AI? Nhấn trực tiếp nút đăng nhập để xem giao diện 3 cột và mô hình nhận diện.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
