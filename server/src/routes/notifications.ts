import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { FriendService } from '../services/friendService.js';
import { GroupService } from '../services/groupService.js';

const friendService = new FriendService();
const groupService = new GroupService();

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const [friendRequests, groupInvitations] = await Promise.all([
      friendService.getRequests(userId),
      groupService.getInvitations(userId)
    ]);

    const notifications = [
      ...friendRequests
        .filter(r => r.direction === 'incoming')
        .map(r => ({
          id: `friend_req_${r.friendshipId}`,
          type: 'friend_request',
          friendshipId: r.friendshipId,
          userId: r.userId,
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
          createdAt: r.createdAt,
          message: `${r.displayName} sent you a friend request.`
        })),
      ...groupInvitations.map(inv => ({
        id: `group_inv_${inv.id}`,
        type: 'group_invitation',
        invitationId: inv.id,
        groupId: inv.groupId,
        groupName: inv.groupName,
        groupAvatar: inv.groupAvatar,
        inviterId: inv.inviterId,
        inviterName: inv.inviterName,
        createdAt: inv.createdAt,
        message: `${inv.inviterName} invited you to join ${inv.groupName}.`
      }))
    ];

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

export default router;
