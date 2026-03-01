'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Star } from 'lucide-react';
import EnhancedCard from './EnhancedCard';
import AnimatedIcon from './AnimatedIcon';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  price: string;
  color: string;
  accent: string;
  popular?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  index?: number;
  delay?: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  subtitle,
  price,
  color,
  accent,
  popular = false,
  isActive = false,
  onClick,
  index = 0,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`service-card-container ${isActive ? 'active' : ''}`}
    >
      <EnhancedCard
        variant={isActive ? "luxury" : "glass"}
        padding="lg"
        hover
        clickable
        onClick={onClick}
        className={`relative transition-all duration-500 cursor-pointer h-[360px] w-full flex flex-col ${
          isActive 
            ? 'border-2 border-gold/50 shadow-2xl transform scale-105' 
            : 'border-2 border-white/20 hover:border-gold/30'
        }`}
      >
        {/* Popular badge */}
        {popular && (
          <motion.div
            className="absolute -top-3 -right-3 bg-gold text-agarwood px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Star size={12} fill="currentColor" />
            <span>Popular</span>
          </motion.div>
        )}

        <div className="text-center h-full flex flex-col">
          {/* Icon Section - Exact Height */}
          <div className="h-[100px] flex items-center justify-center py-4">
            <motion.div
              className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg relative overflow-hidden`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatedIcon
                icon={icon}
                size={isActive ? 32 : 28}
                variant={isActive ? "luxury" : "default"}
                animate={isActive ? "pulse" : "bounce"}
              />
              
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gold/20 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
          </div>

          {/* Title Section - Exact Height with Text Clamping */}
          <div className="h-[120px] flex flex-col justify-center px-2">
            <h3 className={`service-card-title text-lg lg:text-xl font-serif font-bold mb-3 transition-colors duration-300 leading-tight line-clamp-2 ${
              isActive ? 'text-gold' : 'text-agarwood'
            }`}>
              {title}
            </h3>
            <p className="service-card-subtitle text-sm text-agarwood/70 font-medium leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          </div>

          {/* Price Section - Exact Height */}
          <div className={`h-[60px] flex items-center justify-center px-2 text-sm font-semibold transition-colors duration-300 ${
            isActive ? 'text-gold' : 'text-agarwood/80'
          }`}>
            <span className="service-card-price line-clamp-2 text-center">{price}</span>
          </div>

          {/* Selection indicator - Fixed Bottom */}
          <div className="h-[40px] flex items-center justify-center">
            <motion.div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive ? 'bg-gold shadow-lg' : 'bg-agarwood/20'
              }`}
              animate={{
                scale: isActive ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: isActive ? 1.5 : 0.3,
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </EnhancedCard>
    </motion.div>
  );
};

export default ServiceCard;
