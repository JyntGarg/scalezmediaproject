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
  Phone,
  Info
} from "lucide-react";

const OutboundTab = ({ data = [], updateData, offers = [] }) => {
  const [editingEvent, setEditingEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const defaultEvent = {
    title: '',
    offerId: 'all',
    channel: 'Sales Development',
    startTimeDays: 0,
    endTimeDays: 30,
    spendPerDayPerSDR: 300,
    numberOfSDRs: 1,
    dailyContactsPerSDR: 50,
    contactToLeadRate: 0.05,
    leadToSaleRate: 0.15,
    timeToMarketDays: 5,
    timeToSellDays: 45,
    timeToCollectDays: 1,
    validated: 'Pending',
    validationData: '',
  };

  const channels = [
    'Sales Development',
    'Cold Email', 
    'Cold Calling',
    'LinkedIn Outreach',
    'Account-Based Marketing',
    'Direct Mail',
    'Trade Shows',
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
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle>Outbound Sales Events</CardTitle>
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
                    {selectedIndex >= 0 ? 'Edit Outbound Event' : 'Create Outbound Event'}
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
                          placeholder="e.g., SDR Campaign, Cold Email Outreach"
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
                          <Label htmlFor="numberOfSDRs">Number of SDRs</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="numberOfSDRs"
                          type="number"
                          min="1"
                          value={editingEvent.numberOfSDRs}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, numberOfSDRs: isNaN(value) ? 1 : Math.max(1, value) });
                          }}
                          placeholder="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="spendPerDayPerSDR">Daily Spend per SDR</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="spendPerDayPerSDR"
                          type="number"
                          step="0.01"
                          value={editingEvent.spendPerDayPerSDR}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, spendPerDayPerSDR: isNaN(value) ? 0 : value });
                          }}
                          placeholder="300.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="dailyContactsPerSDR">Daily Contacts per SDR</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="dailyContactsPerSDR"
                          type="number"
                          min="1"
                          value={editingEvent.dailyContactsPerSDR}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, dailyContactsPerSDR: isNaN(value) ? 1 : Math.max(1, value) });
                          }}
                          placeholder="50"
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
                          <Label htmlFor="contactToLeadRate">Contact to Lead Rate (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="contactToLeadRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingEvent.contactToLeadRate * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEvent({ ...editingEvent, contactToLeadRate: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="5.0"
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
                          placeholder="15.0"
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
                          placeholder="5"
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
                          placeholder="45"
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
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Outbound Events</h3>
              <p className="text-muted-foreground">Create outbound sales campaigns to reach potential customers directly.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>SDRs</TableHead>
                  <TableHead>Daily Spend</TableHead>
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
                    <TableCell>{event.numberOfSDRs}</TableCell>
                    <TableCell>{formatCurrency(event.spendPerDayPerSDR * event.numberOfSDRs)}</TableCell>
                    <TableCell>{(event.leadToSaleRate * 100).toFixed(1)}%</TableCell>
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

export default OutboundTab;