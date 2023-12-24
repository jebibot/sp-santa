(async () => {
  const toast = document.querySelector(".toast_message.chat");
  const nAllViewer = document.getElementById("nAllViewer");

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const giftSubscription = async (szRecvId) => {
    try {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        credentials: "include",
      };

      const { nBroadNo, szBjId } = liveView.LiveViewInfo;
      const body = new URLSearchParams({
        szSendType: Math.random(),
        szRecvId,
        nBroadNo,
        szSubscriptionBj: szBjId,
      });
      const createCode = await fetch(
        `${ST_AFREECATV}/api/item/subscription.php?szWork=createCode`,
        {
          ...options,
          method: "POST",
          body,
        }
      );
      if (!createCode.ok) {
        return;
      }
      const code = await createCode.json();
      if (code.RESULT !== 1 || !code.MSG) {
        return;
      }

      const params = new URLSearchParams({
        szWork: "sendItem",
        szFileType: "json",
        szData: code.MSG,
        szRecvId,
        szChatId: liveView.ChatInfo.myUserInfo.szUserChatId,
        szSubscriptionBj: szBjId,
        nBroadNo,
        nItemType: "1",
        broad_no: nBroadNo,
        sys_type: "HTML5",
        location: "live",
      });
      const sendItem = await fetch(
        `${ST_AFREECATV}/api/item/subscription.php?${params.toString()}`,
        options
      );
      if (!sendItem.ok) {
        return;
      }
      const result = await sendItem.json();
      if (result.RESULT !== 1 || result.FAIL_CNT || result.FAIL_LIST) {
        return;
      }
      return `선물 성공: ${szRecvId}`;
    } catch (e) {}
  };

  const getList = async (tries = 0) => {
    if (tries % 8 === 0) {
      liveView.playerController.sendChUser();
      await wait(300);
    }
    const listLayer = liveView.Chat.chatUserListLayer;
    const chatCount = Object.values(listLayer.userListSeparatedByGrade).reduce(
      (acc, cur) => acc + Object.keys(cur).length - 1,
      0
    );
    const viewerCount = Number(nAllViewer.textContent.replace(/,/g, "")) || 5;
    if (chatCount < 0.5 * viewerCount) {
      if (tries > 100) {
        return;
      }
      return wait(100).then(() => getList(tries + 1));
    }
    return listLayer.getUserListForSDK();
  };

  const getRandom = (arr, n) => {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  };

  if (toast != null) {
    toast.querySelector("p").textContent = "참여자 목록을 가져오는 중입니다.";
    toast.style.display = "";
  }
  const userList = await getList();
  if (toast != null) {
    toast.style.display = "none";
  }
  if (userList == null) {
    alert("참여자 목록을 가져오는데 실패했습니다.");
    return;
  }

  const TYPE_MAP = {
    매니저: "manager",
    열혈팬: "hot",
    구독팬: "subscription",
    팬: "fan",
    서포터: "supporter",
    일반: "normal",
  };
  const type =
    TYPE_MAP[
      prompt(
        "선물할 대상을 입력해주세요.\n(매니저, 열혈팬, 구독팬, 팬, 서포터, 일반)"
      )
    ];
  const num = Number(prompt("선물할 인원을 입력해주세요."));
  if (isNaN(num) || num < 1) {
    alert("잘못된 인원입니다.");
    return;
  }
  const list = userList[type];
  if (list == null || list.length === 0) {
    alert("대상이 없습니다.");
    return;
  }

  if (toast != null) {
    toast.querySelector("p").textContent = "선물 중입니다.";
    toast.style.display = "";
  }
  const giftList = list.length <= num ? list : getRandom(list, num);
  const result = [];
  for (const user of giftList) {
    const userId = user.id.split("(")[0];
    result.push((await giftSubscription(userId)) || `선물 실패: ${userId}`);
    await wait(100);
  }
  alert(result.join("\n"));
  if (toast != null) {
    toast.style.display = "none";
  }
})().catch(() => {
  alert("오류가 발생했습니다.");
});
