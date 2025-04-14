document.addEventListener('DOMContentLoaded', function() {
  // 登録リンクのクリックイベントを処理
  const registerLinks = document.querySelectorAll('a[href*="/student/auth/register"]');
  registerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      loadVerificationQuestion();
    });
  });

  // 問題を読み込む
  function loadVerificationQuestion() {
    fetch('/student/api/get-verification-question')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          displayQuestion(data.question);
          const modal = new bootstrap.Modal(document.getElementById('verificationModal'));
          modal.show();
        } else {
          // エラーの場合は直接登録ページへリダイレクト
          window.location.href = '/student/auth/register';
        }
      })
      .catch(error => {
        console.error('問題の読み込みに失敗しました:', error);
        window.location.href = '/student/auth/register';
      });
  }

  // 問題を表示
  function displayQuestion(question) {
    document.getElementById('questionText').textContent = question.question_text;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    const options = JSON.parse(question.options);
    options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'form-check mb-2';
      optionDiv.innerHTML = `
        <input class="form-check-input" type="radio" name="answer" id="option${index}" value="${index}">
        <label class="form-check-label" for="option${index}">${option}</label>
      `;
      optionsContainer.appendChild(optionDiv);
    });
    
    // 問題IDを保存
    document.getElementById('verificationForm').dataset.questionId = question.id;
  }

  // 回答を送信
  document.getElementById('submitAnswer').addEventListener('click', function() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (!selectedOption) {
      alert('回答を選択してください');
      return;
    }
    
    const answer = selectedOption.value;
    const questionId = document.getElementById('verificationForm').dataset.questionId;
    
    fetch('/student/api/verify-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_id: questionId,
        answer: answer
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // 正解の場合は登録ページへリダイレクト
        window.location.href = '/student/auth/register';
      } else {
        // 不正解の場合はF.txtに飛ばす
        alert('回答が正しくありません。');
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('verificationModal'));
        modal.hide();
        
        // F.txtに飛ばす
        window.location.href = '/student/api/f-screen';
      }
    })
    .catch(error => {
      console.error('回答の送信に失敗しました:', error);
      alert('エラーが発生しました。');
      
      // モーダルを閉じる
      const modal = bootstrap.Modal.getInstance(document.getElementById('verificationModal'));
      modal.hide();
      
      // F.txtに飛ばす
      window.location.href = '/student/api/f-screen';
    });
  });
}); 