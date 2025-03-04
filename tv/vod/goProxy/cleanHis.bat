@echo off
REM Check if inside a git repository
git pull origin master
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo "This is not a Git repository."
    exit /b 1
)

REM Create a new orphan branch
git checkout --orphan temp_branch
if errorlevel 1 (
    echo "Failed to create a new orphan branch."
    exit /b 1
)
REM Add all files to the new commit
git add -A
if errorlevel 1 (
    echo "Failed to add files to the new commit."
    exit /b 1
)

REM Commit the changes

git commit -m "Your commit message" --author="jueji <aweqv@mailto.plus>"
if errorlevel 1 (
    echo "Failed to commit changes."
    exit /b 1
)

REM Delete the old branch
git branch -D master >nul 2>&1
git branch -D main >nul 2>&1

REM Rename the new branch to master
git branch -m master

REM Force push to origin
git push -f origin master
if errorlevel 1 (
    echo "Failed to push changes to remote."
    exit /b 1
)

echo "Git history has been reset. The new history has been pushed to the remote repository."
exit /b 0
