import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import { LoadingCenter, LoadingDots } from '../components/ui/Loading';
import type { Group, GroupMember, GroupWatchlistItem } from '@watchly/shared';
import type { Paginated } from '@watchly/shared';

export function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createName, setCreateName] = useState('');
  const [createAvatarFile, setCreateAvatarFile] = useState<File | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [watchlist, setWatchlist] = useState<GroupWatchlistItem[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupAvatarFile, setEditGroupAvatarFile] = useState<File | null>(null);
  const [editGroupLoading, setEditGroupLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=/groups');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [groupsResponse, invitationsResponse] = await Promise.all([
        apiGet<Paginated<Group> | Group[]>('/groups'),
        apiGet<any[]>('/groups/invitations')
      ]);
      const groupsData: any = groupsResponse;
      const invData: any = invitationsResponse;
      setGroups(Array.isArray(groupsData) ? groupsData : groupsData.items ?? []);
      setInvitations(Array.isArray(invData) ? invData : invData.items ?? []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      if (createAvatarFile) {
        const formData = new FormData();
        formData.append('name', createName.trim());
        formData.append('avatar', createAvatarFile);
        
        await apiPost<Group>('/groups', formData);
      } else {
        await apiPost<Group>('/groups', { 
          name: createName.trim(),
        });
      }
      
      setCreateName('');
      setCreateAvatarFile(null);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRespondInvite = async (id: string, accept: boolean) => {
    try {
      await apiPost(`/groups/invitations/${id}/respond`, { accept });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectGroup = async (group: Group) => {
    setSelectedGroup(group);
    setIsEditingGroup(false);
    setGroupLoading(true);
    try {
      const [mems, itemsRaw] = await Promise.all([
        apiGet<GroupMember[]>(`/groups/${group.id}/members`),
        apiGet<Paginated<GroupWatchlistItem> | GroupWatchlistItem[]>(`/groups/${group.id}/watchlist`)
      ]);
      setMembers(mems);
      const itemsData: any = itemsRaw;
      setWatchlist(Array.isArray(itemsData) ? itemsData : itemsData.items ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setGroupLoading(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setEditGroupLoading(true);
    try {
      let updatedGroup;
      if (editGroupAvatarFile) {
        const formData = new FormData();
        formData.append('name', editGroupName.trim());
        formData.append('avatar', editGroupAvatarFile);
        updatedGroup = await apiPatch<Group>(`/groups/${selectedGroup.id}`, formData);
      } else {
        updatedGroup = await apiPatch<Group>(`/groups/${selectedGroup.id}`, { name: editGroupName.trim() });
      }
      
      setSelectedGroup(updatedGroup);
      setIsEditingGroup(false);
      loadData();
    } catch (err) {
      console.error('Failed to edit group:', err);
    } finally {
      setEditGroupLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !inviteEmail.trim()) return;

    try {
      await apiPost(`/groups/${selectedGroup.id}/invite`, { email: inviteEmail.trim() });
      setInviteEmail('');
      alert('Invitation sent!');
    } catch (err: any) {
      alert(err.message || 'Failed to send invite');
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !videoUrl.trim() || !videoTitle.trim()) return;

    try {
      await apiPost(`/groups/${selectedGroup.id}/watchlist`, {
        url: videoUrl,
        title: videoTitle
      });
      setVideoUrl('');
      setVideoTitle('');
      const itemsRaw = await apiGet<Paginated<GroupWatchlistItem> | GroupWatchlistItem[]>(`/groups/${selectedGroup.id}/watchlist`);
      const itemsData: any = itemsRaw;
      setWatchlist(Array.isArray(itemsData) ? itemsData : itemsData.items ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (itemId: string) => {
    if (!selectedGroup) return;
    try {
      await apiPost(`/groups/${selectedGroup.id}/watchlist/${itemId}/vote`);
      const itemsRaw = await apiGet<Paginated<GroupWatchlistItem> | GroupWatchlistItem[]>(`/groups/${selectedGroup.id}/watchlist`);
      const itemsData: any = itemsRaw;
      setWatchlist(Array.isArray(itemsData) ? itemsData : itemsData.items ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWatchParty = async (item: GroupWatchlistItem) => {
    try {
      const data = await apiPost<any>('/rooms', {
        name: `${selectedGroup?.name} Watch Party`,
        displayName: user?.displayName || 'Host',
        videoUrl: item.video.url,
      });
      sessionStorage.setItem(`watchly_session_${data.roomId}`, data.sessionId);
      sessionStorage.setItem('watchly_displayName', user?.displayName || 'Host');
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingCenter text="Loading groups" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container two-column-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', flex: 1, minHeight: 0 }}>
        {/* LEFT COLUMN: Group Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Create Group */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px' }}>Groups</h2>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <input
                type="text"
                placeholder="Group Name"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: createAvatarFile ? '#fff' : 'var(--color-text-secondary)' }}>
                    {createAvatarFile ? createAvatarFile.name : 'Group Avatar (Optional)      +'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setCreateAvatarFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={createLoading || !createName.trim()}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  opacity: createLoading || !createName.trim() ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {createLoading ? (
                  <>
                    Creating
                    <LoadingDots />
                  </>
                ) : 'Create Group'}
              </button>
              {createError && <span style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{createError}</span>}
            </form>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Invitations
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {invitations.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{inv.groupName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Invited by {inv.inviterName}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => handleRespondInvite(inv.id, true)} style={{ flex: 1, padding: '6px', background: 'var(--color-success)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Accept</button>
                      <button onClick={() => handleRespondInvite(inv.id, false)} style={{ flex: 1, padding: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              My Groups ({groups.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.length === 0 ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>You aren't in any groups yet.</div>
              ) : (
                groups.map(group => {
                  const isSelected = selectedGroup?.id === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleSelectGroup(group)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        background: isSelected ? 'var(--color-surface-hover)' : 'transparent',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, flexShrink: 0, overflow: 'hidden' }}>
                        {group.avatarUrl ? (
                          <img src={group.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          group.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.95rem' }}>{group.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Group Details */}
        <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', padding: '32px', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
          {!selectedGroup ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Select a group to view details</div>
            </div>
          ) : groupLoading ? (
            <LoadingCenter size="md" text="Loading group" variant="dots" />
          ) : (
            <>
              {isEditingGroup ? (
                <form onSubmit={handleEditGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', background: 'var(--color-bg-input)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Edit Group</h3>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600, overflow: 'hidden'
                    }}>
                      {selectedGroup.avatarUrl ? (
                        <img src={selectedGroup.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        selectedGroup.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <label style={{
                      padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                      <span style={{ color: editGroupAvatarFile ? '#fff' : 'var(--color-text-secondary)' }}>
                        {editGroupAvatarFile ? editGroupAvatarFile.name : 'Change Avatar'}
                      </span>
                      <input
                        type="file" accept="image/*"
                        onChange={e => setEditGroupAvatarFile(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  
                  <input
                    type="text" placeholder="Group Name"
                    value={editGroupName}
                    onChange={e => setEditGroupName(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                  />
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" onClick={() => setIsEditingGroup(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--color-text-muted)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={editGroupLoading || !editGroupName.trim()} style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', fontWeight: 600, opacity: editGroupLoading || !editGroupName.trim() ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {editGroupLoading ? (
                        <>
                          Saving
                          <LoadingDots />
                        </>
                      ) : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, overflow: 'hidden' }}>
                      {selectedGroup.avatarUrl ? (
                        <img src={selectedGroup.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        selectedGroup.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedGroup.name}</h2>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{members.length} members</span>
                    </div>
                  </div>
                  
                  {selectedGroup.ownerId === user?.id && (
                    <button
                      onClick={() => {
                        setEditGroupName(selectedGroup.name);
                        setEditGroupAvatarFile(null);
                        setIsEditingGroup(true);
                      }}
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}
                    >
                      Edit Group
                    </button>
                  )}
                </div>
              )}

              {/* Add Member */}
              <form onSubmit={handleInvite} className="form-inline" style={{ marginBottom: '32px' }}>
                <input
                  type="email"
                  placeholder="Invite user by email..."
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                />
                <button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  style={{ padding: '0 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', fontWeight: 600, opacity: !inviteEmail.trim() ? 0.6 : 1 }}
                >
                  Invite
                </button>
              </form>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Group Watchlist</h3>
              
              <form onSubmit={handleAddVideo} className="form-inline" style={{ marginBottom: '32px' }}>
                <input
                  placeholder="Video URL (YouTube or .mp4)"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  style={{ flex: 2, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
                />
                <input
                  placeholder="Title"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
                />
                <button
                  type="submit"
                  disabled={!videoUrl.trim() || !videoTitle.trim()}
                  style={{ padding: '0 24px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', fontWeight: 600, opacity: !videoUrl.trim() || !videoTitle.trim() ? 0.6 : 1 }}
                >
                  Add
                </button>
              </form>

              {watchlist.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  Nothing in the watchlist yet. Add a video above!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {watchlist.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      
                      {/* Voting */}
                      <button
                        onClick={() => handleVote(item.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '50px',
                          background: item.userVoted ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                          border: '1px solid',
                          borderColor: item.userVoted ? 'var(--color-accent)' : 'var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          color: item.userVoted ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>▲</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.voteCount || 0}</span>
                      </button>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.video.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '8px' }}>
                          <span>Added by {item.addedByName}</span>
                          <span>•</span>
                          <span>{item.video.provider}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleStartWatchParty(item)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: 'var(--color-text)'
                        }}
                      >
                        Start Watch Party
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
