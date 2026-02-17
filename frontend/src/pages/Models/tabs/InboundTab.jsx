import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MousePointer,
  Info
} from "lucide-react";

const InboundTab = ({ data = [], updateData, offers = [] }) => {
  const [editingEvent, setEditingEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const defaultEvent = {
    title: '',
    offerId: 'all',
    channel: 'Google Ads',
    startTimeDays: 0,
    endTimeDays: 30,
    spendPerDay: 0,
    cpm: 12,
    ctr: 0.01,
    clickToLpvRate: 0.7,
    lpvToLeadRate: 0.08,
    leadToSaleRate: 0.05,
    timeToMarketDays: 20,
    timeToSellDays: 30,
    timeToCollectDays: 1,
    validated: 'Pending',
    validationData: '',
  };

  const channels = [
    'Google Ads',
    'Facebook Ads', 
    'LinkedIn Ads',
    'Twitter Ads',
    'Display Network',
    'YouTube Ads',
    'TikTok Ads',
    'Other',
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    const newEvents = [...data];
    if (selectedIndex >= 0) {
      newEvents[selectedIndex] = editingEvent;
    } else {
      newEvents.push(editingEvent);
    }

    updateData(newEvents);
    setIsDialogOpen(false);
    setEditingEvent(null);
    setSelectedIndex(-1);
  };

  const deleteEvent = (index) => {
    const newEvents = data.filter((_, i) => i !== index);
    updateData(newEvents);
  };

  const openEditDialog = (event, index) => {
    setEditingEvent(event || defaultEvent);
    setSelectedIndex(index ?? -1);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-primary" />
              <CardTitle>Inbound Marketing Events</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => openEditDialog()}
                  className="bg-black hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndex >= 0 ? 'Edit Inbound Event' : 'Create Inbound Event'}
                  </DialogTitle>
                </DialogHeader>
                {editingEvent && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="title">Title</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="title"
                          value={editingEvent.title}
                          onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                          placeholder="e.g., Google Ads Campaign"
                          required
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="offerId">Target Offer</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Select 
                          value={editingEvent.offerId} 
                          onValueChange={(value) => setEditingEvent({ ...editingEvent, offerId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target offer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Offers</SelectItem>
                            {offers.map((offer) => (
                              <SelectItem key={offer.id} value={offer.id}>
                                {offer.name || offer.segmentName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="channel">Channel</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Select 
                          value={editingEvent.channel} 
                          onValueChange={(value) => setEditingEvent({ ...editingEvent, channel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {channels.map((channel) => (
                              <SelectItem key={channel} value={channel}>
                                {channel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="spendPerDay">Daily Spend</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="spendPerDay"
                          type="number"
                          step="0.01"
                          value={editingEvent.spendPerDay}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, spendPerDay: isNaN(value) ? 0 : value });
                          }}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="startTimeDays">Start Time (Days)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="startTimeDays"
                          type="number"
                          value={editingEvent.startTimeDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, startTimeDays: isNaN(value) ? 0 : value });
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="endTimeDays">End Time (Days)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="endTimeDays"
                          type="number"
                          value={editingEvent.endTimeDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, endTimeDays: isNaN(value) ? 30 : value });
                          }}
                          placeholder="30"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="cpm">CPM (Cost per 1000 impressions)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="cpm"
                          type="number"
                          step="0.01"
                          value={editingEvent.cpm}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, cpm: isNaN(value) ? 0 : value });
                          }}
                          placeholder="12.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="ctr">CTR (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="ctr"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editingEvent.ctr * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, ctr: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="1.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="clickToLpvRate">Click to Landing Page Rate (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="clickToLpvRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingEvent.clickToLpvRate * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, clickToLpvRate: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="70.0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="lpvToLeadRate">Landing Page to Lead Rate (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="lpvToLeadRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingEvent.lpvToLeadRate * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, lpvToLeadRate: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="8.0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="leadToSaleRate">Lead to Sale Rate (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="leadToSaleRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingEvent.leadToSaleRate * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, leadToSaleRate: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="5.0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="timeToMarketDays">Time to Market (Days)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="timeToMarketDays"
                          type="number"
                          value={editingEvent.timeToMarketDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, timeToMarketDays: isNaN(value) ? 0 : value });
                          }}
                          placeholder="20"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="timeToSellDays">Time to Sell (Days)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="timeToSellDays"
                          type="number"
                          value={editingEvent.timeToSellDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, timeToSellDays: isNaN(value) ? 0 : value });
                          }}
                          placeholder="30"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="timeToCollectDays">Time to Collect (Days)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="timeToCollectDays"
                          type="number"
                          value={editingEvent.timeToCollectDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, timeToCollectDays: isNaN(value) ? 0 : value });
                          }}
                          placeholder="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="validated">Validation Status</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Select 
                          value={editingEvent.validated} 
                          onValueChange={(value) => setEditingEvent({ ...editingEvent, validated: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Validated">Validated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="validationData">Validation Data</Label>
                        <div className="cursor-help">
                          <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </div>
                      </div>
                      <Textarea
                        id="validationData"
                        value={editingEvent.validationData}
                        onChange={(e) => setEditingEvent({ ...editingEvent, validationData: e.target.value })}
                        placeholder="Describe validation data or testing results..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800">Save Event</Button>
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
              <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Inbound Events</h3>
              <p className="text-muted-foreground">Create inbound marketing campaigns to drive traffic and conversions.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Daily Spend</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.channel}</TableCell>
                    <TableCell>Days {event.startTimeDays}-{event.endTimeDays}</TableCell>
                    <TableCell>{formatCurrency(event.spendPerDay)}</TableCell>
                    <TableCell>{(event.ctr * 100).toFixed(2)}%</TableCell>
                    <TableCell>{(event.leadToSaleRate * 100).toFixed(2)}%</TableCell>
                    <TableCell>
                      {event.validated === 'Validated' ? (
                        <Badge className="bg-black text-white">Validated</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(event, index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEvent(index)}
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

export default InboundTab;