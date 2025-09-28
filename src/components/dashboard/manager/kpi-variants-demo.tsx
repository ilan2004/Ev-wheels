'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedKPIs } from './enhanced-kpi-cards';
import { EssentialKPIs } from './essential-kpis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Palette, Eye } from 'lucide-react';

export function KPIVariantsDemo() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<'glassmorphic' | 'neon' | 'compact' | 'detailed' | 'current'>('glassmorphic');

  // Sample KPI data
  const mockData = {
    overdue: 3,
    dueToday: 8,
    openTickets: 23,
    weeklyCompleted: 47
  };

  const variants = [
    { 
      id: 'current' as const, 
      name: 'Current Design', 
      description: 'The existing implementation',
      features: ['Basic styling', 'Color variants', 'Click interactions']
    },
    { 
      id: 'glassmorphic' as const, 
      name: 'Glassmorphic', 
      description: 'Modern glass effect with backdrop blur',
      features: ['Backdrop blur', 'Subtle gradients', 'Trend indicators', 'Monospace numbers']
    },
    { 
      id: 'neon' as const, 
      name: 'Neon/Gaming', 
      description: 'High-tech gaming aesthetic with glowing effects',
      features: ['Neon glow effects', 'Dark theme optimized', 'Text shadows', 'Gaming aesthetics']
    },
    { 
      id: 'compact' as const, 
      name: 'Clean Minimal', 
      description: 'Clean design with left accent border',
      features: ['Left accent border', 'Trend badges', 'Minimal styling', 'Perfect dark mode']
    },
    { 
      id: 'detailed' as const, 
      name: 'Detailed Progress', 
      description: 'Rich cards with progress bars and targets',
      features: ['Progress bars', 'Target tracking', 'Rich gradients', 'Comprehensive info']
    }
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">KPI Card Design Variants</h1>
            <p className="text-muted-foreground mt-2">
              Compare different design approaches for dashboard KPI cards
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="gap-2"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </div>

        {/* Variant Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Design Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {variants.map((variant) => (
                <Card 
                  key={variant.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedVariant === variant.id 
                      ? 'ring-2 ring-primary shadow-md' 
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedVariant(variant.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{variant.name}</h3>
                        {selectedVariant === variant.id && (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {variant.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {variant.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards Display */}
        <Card>
          <CardHeader>
            <CardTitle>
              {variants.find(v => v.id === selectedVariant)?.name} - Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedVariant === 'current' ? (
                <EssentialKPIs
                  data={mockData}
                  onMetricClick={(metric) => console.log('Clicked:', metric)}
                />
              ) : (
                <EnhancedKPIs
                  data={mockData}
                  variant={selectedVariant}
                  onMetricClick={(metric) => console.log('Clicked:', metric)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Design Analysis */}
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Design Comparison</TabsTrigger>
            <TabsTrigger value="darkmode">Dark Mode Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Design Comparison Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-600">✅ Strengths by Variant</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Glassmorphic:</strong> Modern, professional, great readability
                      </div>
                      <div>
                        <strong>Neon:</strong> Eye-catching, perfect for dark mode, gaming aesthetic
                      </div>
                      <div>
                        <strong>Clean Minimal:</strong> Professional, accessible, versatile
                      </div>
                      <div>
                        <strong>Detailed:</strong> Information-rich, progress tracking, comprehensive
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-amber-600">⚠️ Considerations</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Current:</strong> Limited dark mode support, basic styling
                      </div>
                      <div>
                        <strong>Neon:</strong> May be too intense for long sessions
                      </div>
                      <div>
                        <strong>Glassmorphic:</strong> Requires modern browser support
                      </div>
                      <div>
                        <strong>Detailed:</strong> More complex, potentially overwhelming
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="darkmode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {variants.map((variant) => {
                      const scores = {
                        current: { readability: 6, contrast: 7, aesthetics: 5 },
                        glassmorphic: { readability: 9, contrast: 9, aesthetics: 9 },
                        neon: { readability: 8, contrast: 10, aesthetics: 10 },
                        compact: { readability: 9, contrast: 9, aesthetics: 8 },
                        detailed: { readability: 8, contrast: 8, aesthetics: 8 }
                      };
                      
                      const score = scores[variant.id];
                      return (
                        <Card key={variant.id} className="p-4">
                          <h4 className="font-semibold mb-3">{variant.name}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Readability</span>
                              <span className="font-mono">{score.readability}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Contrast</span>
                              <span className="font-mono">{score.contrast}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Aesthetics</span>
                              <span className="font-mono">{score.aesthetics}/10</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">🎯 Best for EV Service Dashboard</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <strong>Primary Recommendation: Glassmorphic</strong>
                        <p className="mt-2">
                          Perfect balance of modern aesthetics, professional appearance, and excellent readability. 
                          The monospace numbers address your typography concerns, and the design works beautifully in both light and dark modes.
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <strong>Alternative: Clean Minimal</strong>
                        <p className="mt-2">
                          If you prefer something more conservative, this offers excellent accessibility and professional appeal 
                          while still using monospace typography for numbers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3">💡 Key Improvements Over Current</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <strong>Monospace numbers</strong> - Better visual hierarchy and readability
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <strong>Proper dark mode</strong> - Uses CSS variables and proper color tokens
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <strong>Trend indicators</strong> - Shows performance direction
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <strong>Enhanced interactions</strong> - Better hover states and animations
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <strong>Better visual hierarchy</strong> - Clear separation of elements
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Switch */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Quick Switch:</span>
            {variants.map((variant) => (
              <Button
                key={variant.id}
                variant={selectedVariant === variant.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedVariant(variant.id)}
              >
                {variant.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
