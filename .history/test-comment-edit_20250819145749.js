const postId = 'f3990889-026c-4c40-bba5-d95c7d2c49af';
const commentId = '33bd2b4e-9660-415f-ad88-4c43be6d144d';
const testEmail = 'tech@example.com';

async function testCommentEdit() {
  try {
    // Test editing a comment
    const formData = new FormData();
    formData.append('intent', 'edit_comment');
    formData.append('commentId', commentId);
    formData.append('authorEmail', testEmail);
    formData.append('content', 'This is absolutely amazing! 🤩 The voice command feature is so smooth. I\'m curious about the accuracy of the voice recognition - what\'s your experience with different accents and background noise?\n\n[EDITED: Added more thoughts!]');

    const response = await fetch(`http://localhost:5173/posts/${postId}`, {
      method: 'POST',
      body: formData
    });

    const result = await response.text();
    console.log('Comment edit response status:', response.status);
    
    if (response.status === 200) {
      try {
        const jsonResult = JSON.parse(result);
        console.log('Comment edit success:', jsonResult);
      } catch (e) {
        console.log('Comment edit response (HTML redirect):', result.substring(0, 200));
      }
    } else {
      console.log('Comment edit failed:', result);
    }

  } catch (error) {
    console.error('Error testing comment edit:', error);
  }
}

testCommentEdit();
