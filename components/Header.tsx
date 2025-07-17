'use client'

import React from 'react'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Switch } from '@nextui-org/react'
import { useTheme } from 'next-themes'
import { Sun, Moon, BarChart3 } from 'lucide-react'

export default function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <Navbar className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4">
      <NavbarBrand>
        <div className="flex items-center space-x-2">
          <BarChart3 size={24} className="text-primary sm:w-8 sm:h-8" />
          <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
            <span className="hidden sm:inline">A/B Testing Analyzer</span>
            <span className="sm:hidden">A/B Analyzer</span>
          </span>
        </div>
      </NavbarBrand>
      
      <NavbarContent justify="end">
        <NavbarItem>
          <Switch
            defaultSelected={theme === 'dark'}
            onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
            thumbIcon={({ isSelected, className }) =>
              isSelected ? (
                <Moon className={className} size={14} />
              ) : (
                <Sun className={className} size={14} />
              )
            }
            size="sm"
          >
            <span className="hidden sm:inline">Dark mode</span>
          </Switch>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
} 