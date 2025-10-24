import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { User, Mail, Calendar, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-4xl">
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Your Profile</h1>
          <p className="text-muted-foreground text-lg">
            Manage your account information
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card className="p-8 glass animate-fade-in">
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="h-24 w-24 bg-gradient-to-br from-primary to-accent">
                <div className="flex items-center justify-center h-full w-full text-white text-3xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <div>
                <h2 className="text-3xl font-bold mb-1">{user.username}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-semibold">{user.username}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-semibold">
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <p className="font-semibold">#{user.id}</p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
