import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Share2, Plus, Edit, Trash2, Info } from "lucide-react";

const defaultEvent = {
  title: '',
  offerId: '',
  channel: 'Referral Program',
  startTimeDays: 30,
  endTimeDays: 365,
  referrersOutOfCustomersPct: 0.1,
  inviteesPerReferral: 3,
  inviteesConversionRate: 0.15,
  timeToReferDays: 7,
  timeToInviteDays: 3,
  timeToSellDays: 14,
  timeToCollectDays: 1,
  validated: '',
  validationData: '',
};

const ViralityTab = ({ data = [], updateData }) => {
  const [editingEvent, setEditingEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const openEditDialog = (event = null, index = -1) => {
    setEditingEvent(event ? { ...event } : { ...defaultEvent });
    setSelectedIndex(index);
    setIsDialogOpen(true);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <CardTitle>Virality Events</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => openEditDialog()}
                  className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Virality Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedIndex >= 0 ? 'Edit' : 'Create'} Virality Event</DialogTitle>
                </DialogHeader>
                {editingEvent && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="title">Title</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="title"
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="offer">Offer</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Select value={editingEvent.offerId} onValueChange={(value) => setEditingEvent({ ...editingEvent, offerId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Offer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default Offer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="channel">Channel</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="channel"
                            value={editingEvent.channel}
                            onChange={(e) => setEditingEvent({ ...editingEvent, channel: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Event Timing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="startTimeDays">Start Time (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="startTimeDays"
                            type="number"
                            value={editingEvent.startTimeDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, startTimeDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="endTimeDays">End Time (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="endTimeDays"
                            type="number"
                            value={editingEvent.endTimeDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, endTimeDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Virality Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Virality Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="referrersOutOfCustomersPct">Referrer % of Customers</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="referrersOutOfCustomersPct"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editingEvent.referrersOutOfCustomersPct * 100}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingEvent({ ...editingEvent, referrersOutOfCustomersPct: isNaN(value) ? 0 : value / 100 });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="inviteesPerReferral">Invitees per Referral</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="inviteesPerReferral"
                            type="number"
                            value={editingEvent.inviteesPerReferral}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, inviteesPerReferral: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="inviteesConversionRate">Invitee Conversion Rate</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="inviteesConversionRate"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editingEvent.inviteesConversionRate * 100}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingEvent({ ...editingEvent, inviteesConversionRate: isNaN(value) ? 0 : value / 100 });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Process Timing */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Process Timing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeToReferDays">Time to Refer (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeToReferDays"
                            type="number"
                            value={editingEvent.timeToReferDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeToReferDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeToInviteDays">Time to Invite (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeToInviteDays"
                            type="number"
                            value={editingEvent.timeToInviteDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeToInviteDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeToSellDays">Time to Sell (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeToSellDays"
                            type="number"
                            value={editingEvent.timeToSellDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeToSellDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeToCollectDays">Time to Collect (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeToCollectDays"
                            type="number"
                            value={editingEvent.timeToCollectDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeToCollectDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Validation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Validation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="validated">Validation Status</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Select
                            value={editingEvent.validated === "Validated" ? "validated" : "not_validated"}
                            onValueChange={(value) => setEditingEvent({ ...editingEvent, validated: value === "validated" ? "Validated" : "" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_validated">Not Validated</SelectItem>
                              <SelectItem value="validated">Validated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="validationData">Validation Data</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        <Textarea
                          id="validationData"
                          value={editingEvent.validationData}
                          onChange={(e) => setEditingEvent({ ...editingEvent, validationData: e.target.value })}
                          className="min-h-[80px]"
                          placeholder="Enter validation data or notes"
                        />
                        </div>
                      </div>
                    </div>


                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800 text-white">Save Event</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No virality events configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead>Referrer %</TableHead>
                  <TableHead>Conversion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.offerId}</TableCell>
                    <TableCell>{(event.referrersOutOfCustomersPct * 100).toFixed(1)}%</TableCell>
                    <TableCell>{(event.inviteesConversionRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge className={event.validated === 'Validated' ? 'bg-black hover:bg-gray-800 text-white' : ''} variant={event.validated === 'Validated' ? undefined : 'outline'}>
                        {event.validated === 'Validated' ? 'Validated' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(event, index)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteEvent(index)}>
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

export default ViralityTab;