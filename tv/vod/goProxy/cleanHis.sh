#!/bin/bash
# 该脚本用于删除main分支的提交历史，并基于当前文件状态创建新的初始提交。

# 检查是否在main分支
if [ $(git branch --show-current) != "main" ]; then
    echo "错误：请先切换到 main 分支！"
    exit 1
fi

# 创建孤立分支（保留工作目录文件）
git checkout --orphan new-main
if [ $? -ne 0 ]; then
    echo "错误：创建孤立分支失败！"
    exit 1
fi

# 添加所有文件（包括未被跟踪的文件）
git add -A
if [ $? -ne 0 ]; then
    echo "错误：添加文件到暂存区失败！"
    exit 1
fi

# 提交更改（基于当前文件状态）
git commit -m "Initial commit"
if [ $? -ne 0 ]; then
    echo "错误：提交失败，请检查文件状态！"
    exit 1
fi

# 删除旧的 main 分支
git branch -D main
if [ $? -ne 0 ]; then
    echo "错误：删除旧分支失败！"
    exit 1
fi

# 重命名新分支为 main
git branch -m main
if [ $? -ne 0 ]; then
    echo "错误：重命名分支失败！"
    exit 1
fi

# 强制推送到远程仓库
git push -f origin main
if [ $? -ne 0 ]; then
    echo "错误：推送失败，请检查远程仓库权限！"
    exit 1
fi

echo "操作成功！main 分支历史已重置为初始提交。"