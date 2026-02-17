import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Settings, Plus, Edit, Trash2, Info } from "lucide-react";

const defaultEvent = {
  title: '',
  description: '',
  startTimeDays: 0,
  endTimeDays: 365,
  amountPerDay: 0,
  employee: false,
};

const AdminTab = ({ data = [], updateData }) => {
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
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Admin & Operations</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => openEditDialog()}
                  className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Admin Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndex >= 0 ? 'Edit Admin Event' : 'Create Admin Event'}
                  </DialogTitle>
                </DialogHeader>
                {editingEvent && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-1 gap-4">
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
                            <Label htmlFor="description">Description</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="description"
                            value={editingEvent.description}
                            onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            placeholder="Optional description of the admin event"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Active Period</h3>
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

                    {/* Cost & Employment */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Cost Structure</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="amountPerDay">Amount per Day ($)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="amountPerDay"
                            type="number"
                            step="0.01"
                            value={editingEvent.amountPerDay}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingEvent({ ...editingEvent, amountPerDay: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="employee">Employment Status</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="employee"
                              checked={editingEvent.employee}
                              onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, employee: checked })}
                              className="data-[state=checked]:bg-black"
                            />
                            <span className="text-sm text-muted-foreground">Is Employee (counts toward headcount)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800 text-white">Save</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admin events configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Daily Amount</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>Day {event.startTimeDays} - {event.endTimeDays}</TableCell>
                    <TableCell>${event.amountPerDay}</TableCell>
                    <TableCell>{event.employee ? 'Yes' : 'No'}</TableCell>
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

export default AdminTab;