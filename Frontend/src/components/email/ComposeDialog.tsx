import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Input,
  Textarea,
  Button,
  Text,
  Combobox,
  Option,
  Tag,
  TagGroup,
} from '@fluentui/react-components';
import {
  Send20Regular,
  Attach20Regular,
  Settings20Regular,
  Dismiss20Regular,
  Clock20Regular,
} from '@fluentui/react-icons';
import { useSendEmail, useSaveDraft } from '@/hooks/useEmailData';
import { useEmailStore } from '@/store/emailStore';
import { EmailAddress } from '@/types/email';

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ComposeDialog: React.FC<ComposeDialogProps> = ({ open, onClose }) => {
  const [to, setTo] = useState<EmailAddress[]>([]);
  const [cc, setCc] = useState<EmailAddress[]>([]);
  const [bcc, setBcc] = useState<EmailAddress[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>();
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMutation = useSendEmail();
  const saveDraftMutation = useSaveDraft();

  const handleAddRecipient = (email: string, type: 'to' | 'cc' | 'bcc') => {
    if (!email.includes('@')) return;

    const recipient: EmailAddress = {
      name: email.split('@')[0],
      email,
    };

    switch (type) {
      case 'to':
        setTo([...to, recipient]);
        setToInput('');
        break;
      case 'cc':
        setCc([...cc, recipient]);
        setCcInput('');
        break;
      case 'bcc':
        setBcc([...bcc, recipient]);
        setBccInput('');
        break;
    }
  };

  const handleRemoveRecipient = (email: string, type: 'to' | 'cc' | 'bcc') => {
    switch (type) {
      case 'to':
        setTo(to.filter((r) => r.email !== email));
        break;
      case 'cc':
        setCc(cc.filter((r) => r.email !== email));
        break;
      case 'bcc':
        setBcc(bcc.filter((r) => r.email !== email));
        break;
    }
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleSend = async () => {
    if (!to.length || !subject.trim()) {
      alert('Please add recipient and subject');
      return;
    }

    await sendMutation.mutateAsync({
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      body,
      attachments: [],
      scheduledTime: showSchedule ? scheduledTime : undefined,
    });

    handleClose();
  };

  const handleSaveDraft = async () => {
    await saveDraftMutation.mutateAsync({
      id: `draft-${Date.now()}`,
      to,
      cc,
      bcc,
      subject,
      body,
      attachments: [],
      labels: [],
      lastSavedAt: new Date(),
      isSending: false,
    });
  };

  const handleClose = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject('');
    setBody('');
    setAttachments([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => data.open || handleClose()}>
      <DialogSurface className="compose-dialog">
        <DialogTitle>Compose Email</DialogTitle>

        <DialogBody>
          {/* To */}
          <div className="compose-field">
            <label className="compose-label">To</label>
            <div className="compose-recipients">
              <TagGroup>
                {to.map((recipient) => (
                  <Tag
                    key={recipient.email}
                    media={
                      <button
                        onClick={() => handleRemoveRecipient(recipient.email, 'to')}
                        aria-label={`Remove ${recipient.email}`}
                      >
                        <Dismiss20Regular />
                      </button>
                    }
                  >
                    {recipient.email}
                  </Tag>
                ))}
              </TagGroup>
              <Input
                value={toInput}
                onChange={(_, data) => setToInput(data.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRecipient(toInput, 'to');
                  }
                }}
                placeholder="recipient@example.com"
                size="small"
              />
            </div>
          </div>

          {/* Cc */}
          {showCc && (
            <div className="compose-field">
              <label className="compose-label">Cc</label>
              <div className="compose-recipients">
                <TagGroup>
                  {cc.map((recipient) => (
                    <Tag
                      key={recipient.email}
                      media={
                        <button
                          onClick={() => handleRemoveRecipient(recipient.email, 'cc')}
                          aria-label={`Remove ${recipient.email}`}
                        >
                          <Dismiss20Regular />
                        </button>
                      }
                    >
                      {recipient.email}
                    </Tag>
                  ))}
                </TagGroup>
                <Input
                  value={ccInput}
                  onChange={(_, data) => setCcInput(data.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRecipient(ccInput, 'cc');
                    }
                  }}
                  placeholder="recipient@example.com"
                  size="small"
                />
              </div>
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div className="compose-field">
              <label className="compose-label">Bcc</label>
              <div className="compose-recipients">
                <TagGroup>
                  {bcc.map((recipient) => (
                    <Tag
                      key={recipient.email}
                      media={
                        <button
                          onClick={() => handleRemoveRecipient(recipient.email, 'bcc')}
                          aria-label={`Remove ${recipient.email}`}
                        >
                          <Dismiss20Regular />
                        </button>
                      }
                    >
                      {recipient.email}
                    </Tag>
                  ))}
                </TagGroup>
                <Input
                  value={bccInput}
                  onChange={(_, data) => setBccInput(data.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRecipient(bccInput, 'bcc');
                    }
                  }}
                  placeholder="recipient@example.com"
                  size="small"
                />
              </div>
            </div>
          )}

          {/* Show Cc/Bcc Options */}
          {!showCc && (
            <Button
              appearance="subtle"
              size="small"
              onClick={() => setShowCc(true)}
            >
              + Cc
            </Button>
          )}
          {!showBcc && (
            <Button
              appearance="subtle"
              size="small"
              onClick={() => setShowBcc(true)}
            >
              + Bcc
            </Button>
          )}

          {/* Subject */}
          <div className="compose-field">
            <Input
              value={subject}
              onChange={(_, data) => setSubject(data.value)}
              placeholder="Subject"
              className="compose-subject"
            />
          </div>

          {/* Body */}
          <div className="compose-field">
            <Textarea
              value={body}
              onChange={(_, data) => setBody(data.value)}
              placeholder="Compose email..."
              className="compose-body"
              resize="vertical"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="compose-attachments">
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <Text size={100}>{file.name}</Text>
                  <Button
                    appearance="subtle"
                    onClick={() =>
                      setAttachments(attachments.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogActions>
          <div className="compose-actions-left">
            <Button
              icon={<Attach20Regular />}
              appearance="subtle"
              onClick={() => fileInputRef.current?.click()}
            >
              Attach
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleAttachFile}
            />

            <Button
              icon={<Clock20Regular />}
              appearance="subtle"
              onClick={() => setShowSchedule(!showSchedule)}
            >
              Schedule
            </Button>

            {showSchedule && (
              <Input
                type="datetime-local"
                value={scheduledTime?.toISOString().slice(0, 16)}
                onChange={(_, data) => setScheduledTime(new Date(data.value))}
                size="small"
              />
            )}
          </div>

          <div className="compose-actions-right">
            <Button appearance="secondary" onClick={handleClose}>
              Discard
            </Button>
            <Button
              appearance="subtle"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isLoading}
            >
              Save Draft
            </Button>
            <Button
              appearance="primary"
              icon={<Send20Regular />}
              onClick={handleSend}
              disabled={sendMutation.isLoading}
            >
              Send
            </Button>
          </div>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
