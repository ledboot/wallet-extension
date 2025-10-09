/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // eslint-disable-next-line import/no-unresolved, global-require
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
  },
  theme: {
    extend: {
      colors: {
        // 基础主题色
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: '#3b82f6',
        },
        // 次要色
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
          DEFAULT: '#64748b',
        },
        // 静音色
        muted: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
          DEFAULT: '#6b7280',
        },
        // 成功色
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          DEFAULT: '#22c55e',
        },
        // 警告色
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          DEFAULT: '#f59e0b',
        },
        // 错误色
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
          DEFAULT: '#ef4444',
        },
        // 信息色
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          DEFAULT: '#0ea5e9',
        },
        // 背景色
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
        },
        // 前景色
        foreground: {
          DEFAULT: '#0f172a',
          secondary: '#64748b',
        },
        // 边框色
        border: {
          DEFAULT: '#e2e8f0',
          secondary: '#cbd5e1',
        },
        // 输入框色
        input: {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
        },
        // 环形进度条色
        ring: {
          DEFAULT: '#3b82f6',
        },
      },
      // 暗色主题颜色
      dark: {
        colors: {
          primary: {
            50: '#172554',
            100: '#1e3a8a',
            200: '#1e40af',
            300: '#1d4ed8',
            400: '#2563eb',
            500: '#3b82f6',
            600: '#60a5fa',
            700: '#93c5fd',
            800: '#bfdbfe',
            900: '#dbeafe',
            950: '#eff6ff',
            DEFAULT: '#3b82f6',
          },
          muted: {
            50: '#030712',
            100: '#111827',
            200: '#1f2937',
            300: '#374151',
            400: '#4b5563',
            500: '#6b7280',
            600: '#9ca3af',
            700: '#d1d5db',
            800: '#e5e7eb',
            900: '#f3f4f6',
            950: '#f9fafb',
            DEFAULT: '#6b7280',
          },
          background: {
            DEFAULT: '#0f172a',
            secondary: '#1e293b',
          },
          foreground: {
            DEFAULT: '#f8fafc',
            secondary: '#cbd5e1',
          },
          border: {
            DEFAULT: '#1e293b',
            secondary: '#334155',
          },
          input: {
            DEFAULT: '#1e293b',
            secondary: '#334155',
          },
        },
      },
    },
  },
};
