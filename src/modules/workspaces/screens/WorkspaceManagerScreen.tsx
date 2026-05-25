import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layouts';
import { Card, Button, Input, Badge, AppText as Text } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../types/workspace';

export function WorkspaceManagerScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const navigation = useNavigation<any>();

  // State selectors
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const inviteMember = useWorkspaceStore((state) => state.inviteMember);
  const removeMember = useWorkspaceStore((state) => state.removeMember);
  const changeMemberRole = useWorkspaceStore((state) => state.changeMemberRole);

  const authUser = useAuthStore((state) => state.user);
  const currentUserId = authUser?.id || 'guest_user_id';

  // Screen layout states
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  
  // Modals Visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Form Fields
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('editor');

  const [targetMember, setTargetMember] = useState<WorkspaceMember | null>(null);

  // Check current user role in the selected workspace
  const userRoleInSelected = React.useMemo(() => {
    if (!selectedWorkspace) return 'admin';
    const member = selectedWorkspace.members.find((m) => m.id === currentUserId);
    return member?.role || 'viewer';
  }, [selectedWorkspace, currentUserId]);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      Alert.alert(t('common.error'), t('workspaces.workspaceNameRequired'));
      return;
    }
    const newId = addWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setShowCreateModal(false);
    
    // Auto-drill down to the new workspace
    const created = useWorkspaceStore.getState().workspaces.find((w) => w.id === newId);
    if (created) {
      setSelectedWorkspace(created);
    }
  };

  const handleSendInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert(t('common.error'), 'Please enter both name and email.');
      return;
    }

    if (selectedWorkspace) {
      inviteMember(selectedWorkspace.id, inviteName.trim(), inviteEmail.trim().toLowerCase(), inviteRole);
      
      // Update local state to reflect newly invited members
      const updated = useWorkspaceStore.getState().workspaces.find((w) => w.id === selectedWorkspace.id);
      if (updated) {
        setSelectedWorkspace(updated);
      }

      setInviteName('');
      setInviteEmail('');
      setInviteRole('editor');
      setShowInviteModal(false);
      Alert.alert(t('common.success'), t('workspaces.inviteSuccess'));
    }
  };

  const handleRoleChangeSubmit = (role: WorkspaceRole) => {
    if (selectedWorkspace && targetMember) {
      changeMemberRole(selectedWorkspace.id, targetMember.id, role);
      
      // Update local detailed state
      const updated = useWorkspaceStore.getState().workspaces.find((w) => w.id === selectedWorkspace.id);
      if (updated) {
        setSelectedWorkspace(updated);
      }

      setShowRoleModal(false);
      setTargetMember(null);
    }
  };

  const handleRemoveMemberPress = (member: WorkspaceMember) => {
    if (!selectedWorkspace) return;
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from this workspace?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            removeMember(selectedWorkspace.id, member.id);
            const updated = useWorkspaceStore.getState().workspaces.find((w) => w.id === selectedWorkspace.id);
            if (updated) {
              setSelectedWorkspace(updated);
            }
          },
        },
      ]
    );
  };

  const handleDeleteWorkspacePress = (w: Workspace) => {
    Alert.alert(
      t('common.delete'),
      `Are you sure you want to permanently delete the workspace "${w.name}"? This will also disconnect its transactions.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteWorkspace(w.id);
            setSelectedWorkspace(null);
          },
        },
      ]
    );
  };

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: flexDirectionStyle }]}>
        <TouchableOpacity
          onPress={() => {
            if (selectedWorkspace) {
              setSelectedWorkspace(null);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.headerButton}
        >
          <Ionicons name={selectedWorkspace ? (isRTL ? 'arrow-forward' : 'arrow-back') : 'close'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {selectedWorkspace ? selectedWorkspace.name : t('workspaces.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!selectedWorkspace ? (
          // WORKSPACE LIST
          <View>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('workspaces.title').toUpperCase()}
            </Text>
            
            {workspaces.length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                <Text style={{ color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md }}>
                  {t('common.noData')}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
                  Create a workspace to share expenses and budgets with family members.
                </Text>
              </Card>
            ) : (
              workspaces.map((w) => {
                const isActive = activeWorkspaceId === w.id;
                const adminMember = w.members.find(m => m.role === 'admin');

                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => setSelectedWorkspace(w)}
                    activeOpacity={0.7}
                    style={[
                      styles.workspaceCard,
                      { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border }
                    ]}
                  >
                    <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                      <View 
                        style={[
                          styles.iconBox, 
                          { backgroundColor: `${colors.primary}15`, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }
                        ]}
                      >
                        <Ionicons name="people" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <Text style={[styles.workspaceNameText, { color: colors.text }]}>{w.name}</Text>
                        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                          {w.members.length} members • Created by {w.createdBy === currentUserId ? 'You' : adminMember?.name || 'Admin'}
                        </Text>
                      </View>
                      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <Button
              title={t('workspaces.createWorkspace')}
              onPress={() => setShowCreateModal(true)}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.xl }}
              leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
            />
          </View>
        ) : (
          // DETAILED WORKSPACE MEMBERS LIST
          <View>
            <View style={[styles.roleSummaryCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {t('workspaces.role').toUpperCase()}
              </Text>
              <View style={[styles.row, { marginTop: spacing.xs, flexDirection: flexDirectionStyle }]}>
                <Ionicons 
                  name={userRoleInSelected === 'admin' ? 'shield-half' : userRoleInSelected === 'editor' ? 'create' : 'eye'} 
                  size={18} 
                  color={userRoleInSelected === 'admin' ? colors.primary : userRoleInSelected === 'editor' ? colors.success : colors.warning} 
                />
                <Text style={[styles.roleText, { color: colors.text }]} className="capitalize">
                  {t(`workspaces.role${userRoleInSelected.charAt(0).toUpperCase() + userRoleInSelected.slice(1)}`)}
                </Text>
              </View>
            </View>

            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md, flexDirection: flexDirectionStyle }]}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 0 }]}>
                {t('workspaces.members').toUpperCase()}
              </Text>
              {userRoleInSelected !== 'viewer' && (
                <TouchableOpacity onPress={() => setShowInviteModal(true)} style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                  <Ionicons 
                    name="person-add" 
                    size={16} 
                    color={colors.primary} 
                    style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} 
                  />
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {t('workspaces.inviteMembers')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedWorkspace.members.map((m) => {
              const isSelf = m.id === currentUserId;
              const canEditRoles = userRoleInSelected === 'admin' && !isSelf;

              return (
                <Card key={m.id} style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                    <View 
                      style={[
                        styles.memberAvatar, 
                        { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }
                      ]}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                        {m.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.memberNameText, { color: colors.text }]}>
                        {m.name}
                      </Text>
                      <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                        {m.email}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Badge 
                        label={t(`workspaces.role${m.role.charAt(0).toUpperCase() + m.role.slice(1)}`).toUpperCase()} 
                        variant={m.role === 'admin' ? 'primary' : m.role === 'editor' ? 'success' : 'warning'} 
                      />
                      
                      {canEditRoles && (
                        <View style={[styles.row, { gap: 12, marginTop: spacing.sm, flexDirection: flexDirectionStyle }]}>
                          <TouchableOpacity
                            onPress={() => {
                              setTargetMember(m);
                              setShowRoleModal(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleRemoveMemberPress(m)}>
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}

            {userRoleInSelected === 'admin' && (
              <Button
                title={t('common.delete')}
                onPress={() => handleDeleteWorkspacePress(selectedWorkspace)}
                variant="danger"
                fullWidth
                style={{ marginTop: spacing['2xl'] }}
                leftIcon={<Ionicons name="trash" size={20} color="#FFFFFF" />}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE WORKSPACE MODAL */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowCreateModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalSheetTitle, { color: colors.text, textAlign: textAlignment }]}>
              {t('workspaces.createWorkspace')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xl, textAlign: textAlignment }}>
              Name your shared space (e.g., "Family Ledger", "Room 402 Expenses").
            </Text>
            
            <Input
              placeholder={t('workspaces.workspaceName')}
              value={newWorkspaceName}
              onChangeText={setNewWorkspaceName}
              leftIcon={<Ionicons name="people-outline" size={20} color={colors.textTertiary} />}
              style={{ textAlign: textAlignment }}
            />

            <View style={[styles.row, { gap: spacing.md, marginTop: spacing.md, flexDirection: flexDirectionStyle }]}>
              <View style={{ flex: 1 }}>
                <Button title={t('common.cancel')} onPress={() => setShowCreateModal(false)} variant="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <Button title={t('common.save')} onPress={handleCreateWorkspace} variant="primary" />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* INVITE MEMBER MODAL */}
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowInviteModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalSheetTitle, { color: colors.text, textAlign: textAlignment }]}>
              {t('workspaces.inviteMembers')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xl, textAlign: textAlignment }}>
              Enter information for the person you want to invite.
            </Text>
            
            <Input
              placeholder="Full Name"
              value={inviteName}
              onChangeText={setInviteName}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.textTertiary} />}
              style={{ textAlign: textAlignment }}
            />

            <Input
              placeholder={t('workspaces.inviteEmail')}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textTertiary} />}
              style={{ textAlign: textAlignment }}
            />

            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm, textAlign: textAlignment }}>
              {t('workspaces.role').toUpperCase()}
            </Text>
            <View style={[styles.rolePickerRow, { flexDirection: flexDirectionStyle }]}>
              {(['editor', 'viewer', 'admin'] as const).map((r) => {
                const isSelected = inviteRole === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setInviteRole(r)}
                    style={[
                      styles.roleChip,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }
                    ]}
                  >
                    <Text style={{ color: isSelected ? colors.primary : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      {t(`workspaces.role${r.charAt(0).toUpperCase() + r.slice(1)}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.row, { gap: spacing.md, marginTop: spacing.xl, flexDirection: flexDirectionStyle }]}>
              <View style={{ flex: 1 }}>
                <Button title={t('common.cancel')} onPress={() => setShowInviteModal(false)} variant="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <Button title={t('common.save')} onPress={handleSendInvite} variant="primary" />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MEMBER ROLE ADJUSTMENT SHEET */}
      <Modal visible={showRoleModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowRoleModal(false)} />
          <View style={[styles.actionSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.actionSheetTitle, { color: colors.text }]}>{t('workspaces.role')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: spacing.lg }}>
              Select a new role for {targetMember?.name}
            </Text>

            {(['admin', 'editor', 'viewer'] as const).map((r) => {
              const isSelected = targetMember?.role === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleRoleChangeSubmit(r)}
                  style={[styles.actionRow, { flexDirection: flexDirectionStyle }]}
                >
                  <Ionicons 
                    name={r === 'admin' ? 'shield-half' : r === 'editor' ? 'create' : 'eye'} 
                    size={18} 
                    color={isSelected ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.actionText, { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '400' }]}>
                    {t(`workspaces.role${r.charAt(0).toUpperCase() + r.slice(1)}`).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  row: {
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  workspaceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  roleSummaryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.1)',
  },
  roleText: {
    marginLeft: 6,
    marginRight: 6,
    fontSize: 16,
    fontWeight: '700',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  rolePickerRow: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  actionText: {
    fontSize: 15,
  },
});
