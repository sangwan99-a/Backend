import React from 'react';
import { Text } from '@fluentui/react-components';

interface TypingIndicatorsProps {
  typingUsers: Map<string, string>; // userId -> userName
}

export const TypingIndicators: React.FC<TypingIndicatorsProps> = ({ typingUsers }) => {
  if (typingUsers.size === 0) {
    return null;
  }

  const userList = Array.from(typingUsers.values());
  let text = '';

  if (userList.length === 1) {
    text = `${userList[0]} is typing`;
  } else if (userList.length === 2) {
    text = `${userList[0]} and ${userList[1]} are typing`;
  } else {
    text = `${userList.slice(0, -1).join(', ')} and ${userList[userList.length - 1]} are typing`;
  }

  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <Text size={300}>
        {text}
      </Text>
    </div>
  );
};
