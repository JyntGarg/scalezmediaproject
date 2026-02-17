import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Separator } from '../../../components/ui/separator';
import { Settings, Info } from 'lucide-react';

export default function SetupTab({ data, updateData }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    currency: "USD",
    projectionPeriodDays: 365,
    initialCash: 100000,
    existingCustomers: 0,
    discountRate: 0.12,
    taxRate: 0.25,
    perpetualGrowthRate: 0.03,
    isPrivate: true,
    ...data
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...data }));
  }, [data]);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateData(newData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency || 'USD'
    }).format(amount);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CHF': 'CHF',
      'CNY': '¥'
    };
    return symbols[currency] || '$';
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>New Simulation Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="title">Title</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter simulation title"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="currency">Currency</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Select
                  value={formData.currency || 'USD'}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.name}</span>
                          <span className="text-muted-foreground">({currency.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="projectionPeriodDays">Projection Period (Days)</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="projectionPeriodDays"
                  type="number"
                  min="1"
                  value={formData.projectionPeriodDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleInputChange('projectionPeriodDays', isNaN(value) ? 365 : Math.max(1, value));
                  }}
                  placeholder="365"
                />
                <p className="text-xs text-muted-foreground">Total days to simulate (drives all calculations)</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="description">Description</Label>
                <div className="cursor-help">
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </div>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your business model simulation"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Starting Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Starting Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="initialCash">Cash in Bank</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="initialCash"
                  type="number"
                  min="0"
                  max="1000000000"
                  value={formData.initialCash ?? 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.min(1000000000, value));
                    handleInputChange('initialCash', clampedValue);
                  }}
                />
                <p className="text-xs text-muted-foreground">Starting cash balance for runway and operations</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="existingCustomers">Existing Customers</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="existingCustomers"
                  type="number"
                  min="0"
                  max="100000000"
                  value={formData.existingCustomers ?? 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.min(100000000, value));
                    handleInputChange('existingCustomers', clampedValue);
                  }}
                />
                <p className="text-xs text-muted-foreground">Current customer base for retention and referrals</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="discountRate">Discount Rate</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="discountRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.discountRate * 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.min(50, value));
                    handleInputChange('discountRate', clampedValue / 100);
                  }}
                />
                <p className="text-xs text-muted-foreground">Annual rate (e.g., 12 for 12%)</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="taxRate">Tax Rate</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="90"
                  value={formData.taxRate * 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.min(90, value));
                    handleInputChange('taxRate', clampedValue / 100);
                  }}
                />
                <p className="text-xs text-muted-foreground">Corporate tax rate (e.g., 25 for 25%)</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="perpetualGrowthRate">Perpetual Growth Rate</Label>
                  <div className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </div>
                <Input
                  id="perpetualGrowthRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.perpetualGrowthRate * 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    handleInputChange('perpetualGrowthRate', isNaN(value) ? 0 : value / 100);
                  }}
                />
                <p className="text-xs text-muted-foreground">Terminal value growth (e.g., 3 for 3%)</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Projection Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="isPrivate">Private Company</Label>
                    <div className="cursor-help">
                      <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Enable private company valuation methods</p>
                </div>
                <Switch
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => handleInputChange('isPrivate', checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Auto-save Info */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <p>✓ Settings are automatically saved as you type</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Ready to run simulation
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}