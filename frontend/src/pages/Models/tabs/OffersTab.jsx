import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Users, 
  Package,
  Settings,
  Info
} from "lucide-react";

const OffersTab = ({ data = [], updateData }) => {
  const [editingOffer, setEditingOffer] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(-1);

  const defaultOffer = {
    id: '',
    segmentName: '',
    description: '',
    versionNumber: 1,
    versionDate: new Date(),
    totalCustomersInMarket: 0,
    expectedValue: 0,
    plans: [],
  };

  const defaultPlan = {
    title: '',
    churnRate: 0,
    price: 0,
    probability: 1,
    distribution: 0,
    costPerSalePct: 0,
    transactionFeePct: 0,
    durationDays: 1080,
    offsetDays: 0,
    costToFulfillPct: 0,
    billingPeriodDays: 30,
    upfrontPayment: false,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateExpectedValue = (plans) => {
    if (plans.length === 0) return 0;
    
    let weightedValue = 0;
    for (const plan of plans) {
      const ltv = plan.price / (plan.churnRate || 0.01); // Simple LTV calculation
      weightedValue += ltv * (plan.distribution || 0);
    }
    return weightedValue;
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    if (!editingOffer) return;

    const updatedOffer = {
      ...editingOffer,
      expectedValue: calculateExpectedValue(editingOffer.plans),
      id: editingOffer.id || Date.now().toString(),
    };

    const newOffers = [...data];
    const isNewOffer = selectedOfferIndex < 0;

    if (selectedOfferIndex >= 0) {
      newOffers[selectedOfferIndex] = updatedOffer;
    } else {
      newOffers.push(updatedOffer);
    }

    updateData(newOffers);
    setIsOfferDialogOpen(false);
    setEditingOffer(null);
    setSelectedOfferIndex(-1);
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    if (!editingOffer || !editingPlan) return;

    const updatedPlans = [...editingOffer.plans];
    const planIndex = updatedPlans.findIndex(p => p.title === editingPlan.title);
    const isNewPlan = planIndex < 0;

    if (planIndex >= 0) {
      updatedPlans[planIndex] = editingPlan;
    } else {
      updatedPlans.push(editingPlan);
    }

    // Auto-distribute when adding new plans
    if (isNewPlan) {
      const totalPlans = updatedPlans.length;
      const baseDistribution = 1 / totalPlans;

      updatedPlans.forEach((plan) => {
        plan.distribution = baseDistribution;
      });
    }

    const updatedOffer = {
      ...editingOffer,
      plans: updatedPlans,
      expectedValue: calculateExpectedValue(updatedPlans),
    };

    setEditingOffer(updatedOffer);

    if (selectedOfferIndex >= 0) {
      const newOffers = [...data];
      newOffers[selectedOfferIndex] = updatedOffer;
      updateData(newOffers);
    }
    setIsPlanDialogOpen(false);
    setEditingPlan(null);
  };

  const editPlan = (plan) => {
    setEditingPlan(plan);
    setIsPlanDialogOpen(true);
  };

  const deleteOffer = (index) => {
    const newOffers = data.filter((_, i) => i !== index);
    updateData(newOffers);
  };

  const deletePlan = (planTitle) => {
    if (!editingOffer) return;
    
    const updatedPlans = editingOffer.plans.filter(plan => plan.title !== planTitle);
    const updatedOffer = {
      ...editingOffer,
      plans: updatedPlans,
      expectedValue: calculateExpectedValue(updatedPlans),
    };
    
    setEditingOffer(updatedOffer);
    
    if (selectedOfferIndex >= 0) {
      const newOffers = [...data];
      newOffers[selectedOfferIndex] = updatedOffer;
      updateData(newOffers);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Offers & Pricing Plans
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Define your products, services, and pricing strategies
              </p>
            </div>
            <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingOffer(defaultOffer);
                    setSelectedOfferIndex(-1);
                  }}
                  className="bg-black hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Offer</DialogTitle>
                </DialogHeader>
                {editingOffer && (
                  <form onSubmit={handleOfferSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="segmentName">Segment Name</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="segmentName"
                          value={editingOffer.segmentName}
                          onChange={(e) => setEditingOffer({ ...editingOffer, segmentName: e.target.value })}
                          placeholder="e.g., Enterprise SaaS"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="versionNumber">Version Number</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="versionNumber"
                          type="number"
                          value={editingOffer.versionNumber}
                          onChange={(e) => setEditingOffer({ ...editingOffer, versionNumber: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="totalCustomersInMarket">Total Customers in Market</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="totalCustomersInMarket"
                          type="number"
                          value={editingOffer.totalCustomersInMarket}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingOffer({ ...editingOffer, totalCustomersInMarket: isNaN(value) ? 0 : value });
                          }}
                        />
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
                        value={editingOffer.description}
                        onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                        placeholder="Describe your offer"
                        rows={3}
                      />
                    </div>

                    <Separator />

                    {/* Plans Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Plans</h3>
                        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => setEditingPlan(defaultPlan)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Plan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Plan</DialogTitle>
                            </DialogHeader>
                            {editingPlan && (
                              <form onSubmit={handlePlanSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                      <Label htmlFor="planTitle">Title</Label>
                                      <div className="cursor-help">
                                        <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                      </div>
                                    </div>
                                    <Input
                                      id="planTitle"
                                      value={editingPlan.title}
                                      onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                                      placeholder="e.g., Gold Plan"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                      <Label htmlFor="price">Price</Label>
                                      <div className="cursor-help">
                                        <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                      </div>
                                    </div>
                                    <Input
                                      id="price"
                                      type="number"
                                      step="0.01"
                                      value={editingPlan.price}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        setEditingPlan({ ...editingPlan, price: isNaN(value) ? 0 : value });
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                      <Label htmlFor="churnRate">Churn Rate (%)</Label>
                                      <div className="cursor-help">
                                        <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                      </div>
                                    </div>
                                    <Input
                                      id="churnRate"
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="50"
                                      value={editingPlan.churnRate * 100}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        const safeValue = isNaN(value) ? 0 : value;
                                        const clampedValue = Math.max(0, Math.min(50, safeValue));
                                        setEditingPlan({ ...editingPlan, churnRate: clampedValue / 100 });
                                      }}
                                      placeholder="5"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                      <Label htmlFor="probability">Probability (%)</Label>
                                      <div className="cursor-help">
                                        <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                      </div>
                                    </div>
                                    <Input
                                      id="probability"
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={editingPlan.probability * 100}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        setEditingPlan({ ...editingPlan, probability: isNaN(value) ? 0 : value / 100 });
                                      }}
                                      placeholder="25"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" className="bg-black hover:bg-gray-800">Save Plan</Button>
                                </div>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>

                      {editingOffer.plans && editingOffer.plans.length > 0 ? (
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Churn Rate</TableHead>
                                <TableHead>Probability</TableHead>
                                <TableHead>Distribution</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {editingOffer.plans.map((plan, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{plan.title}</TableCell>
                                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                                  <TableCell>{(plan.churnRate * 100).toFixed(1)}%</TableCell>
                                  <TableCell>{(plan.probability * 100).toFixed(1)}%</TableCell>
                                  <TableCell>
                                    {plan.distribution ? `${(plan.distribution * 100).toFixed(1)}%` : 'Auto'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => editPlan(plan)}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deletePlan(plan.title)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                          <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No plans added yet</p>
                        </div>
                      )}

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="font-medium">Expected Value: {formatCurrency(editingOffer.expectedValue)}</p>
                        <p className="text-sm text-muted-foreground">Calculated from active plan revenue stream</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800">Save Offer</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Offers Created</h3>
              <p className="text-muted-foreground">Create your first offer to start modeling revenue streams.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Market Size</TableHead>
                  <TableHead>Expected Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((offer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{offer.segmentName || offer.name}</TableCell>
                    <TableCell>v{offer.versionNumber || 1}</TableCell>
                    <TableCell>{offer.totalCustomersInMarket.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(offer.expectedValue || 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{offer.plans?.length || 0} plans</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOffer(data[index]);
                            setSelectedOfferIndex(index);
                            setIsOfferDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOffer(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OffersTab;
