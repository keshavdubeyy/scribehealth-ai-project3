git pDrool3008: why is the structure the exact same in src/main and target whats the significance

GitHub Copilot: The `target/` directory is Maven's **build output folder**. Here's why the structure mirrors `src/main/`:

## What happens during a Maven build (`mvn compile`)

1. **Maven reads** your source files from `src/main/java/` and `src/main/resources/`
2. **Compiles** `.java` files → `.class` bytecode files
3. **Copies** everything into `target/classes/` — preserving the exact same package/folder structure

## Why the structure must match

Java's classloader relies on the **package name = directory path** convention. For example:

- Source: `src/main/java/com/scribehealth/model/User.java`  
  → declares `package com.scribehealth.model;`
- Compiled: `target/classes/com/scribehealth/model/User.class`

The JVM uses this path to locate and load classes at runtime. If the folder structure didn't match the package declarations, the JVM couldn't find the classes.

## The extra files in `target/`

You'll also notice some things that don't exist in `src/`:

| File | Purpose |
|---|---|
| `AuthController$UserProfileResponse.class` | Inner class — Java generates a separate `.class` file for each inner/anonymous class |
| `RegisterRequest$DoctorProfileDto.class` | Same — inner class compiled to its own `.class` file |
| `generated-sources/annotations/` | Output from annotation processors (e.g., Lombok, MapStruct) |
| `maven-status/` | Maven's internal bookkeeping — tracks which files were compiled and when |

## Summary

> `target/classes/` is essentially **the deployable version** of your app. When Spring Boot packages everything into a `.jar`, it takes the contents of `target/classes/` and bundles them up. `src/main/` is just the human-editable source — `target/` is what the machine actually runs.

Drool3008: 1 LINE DESCRIPTION OF EACH JAVA FILE PRESENT 

GitHub Copilot: Searched for files matching `**/backend/java/src/main/java/**/*.java`, 20 matches
Here's a breakdown of everything in `target/` outside of `com/scribehealth`:

---

### `target/classes/`
The root output directory for the entire build. Contains everything the JVM needs to run the app.

| Item | What it does |
|---|---|
| `application.properties` | A **copy** of your config file from `src/main/resources/` — Maven copies all resource files here so the running app can find them on the classpath at runtime. |
| `com/` | The compiled `.class` bytecode files (your Java code, machine-readable). |

---

### `target/test-classes/`
Same idea as `classes/` but for test code — would contain compiled test `.class` files from `src/test/java/`. Currently **empty** because you have no tests written yet.

---

### `target/generated-sources/`
Holds Java source files that were **auto-generated** by annotation processors during the build (not written by you).

| Item | What it does |
|---|---|
| `annotations/` | Output folder for annotation processors (e.g. Lombok, MapStruct, Spring Data). Currently **empty** because none of those processors are generating extra code in this project. |

---

### `target/maven-status/`
Maven's internal bookkeeping folder — tracks what happened during the last build so it can do **incremental compilation** (only recompile changed files).

```
maven-status/
└── maven-compiler-plugin/
    └── compile/
        └── default-compile/
            ├── inputFiles.lst   ← list of ALL .java files that were compiled last time
            └── createdFiles.lst ← list of NEW files generated (empty = nothing new was created)
```

| File | What it does |
|---|---|
| inputFiles.lst | Records the full paths of all 15 `.java` files compiled in the last `mvn compile` run. Next build, Maven diffs this list against current sources to decide what needs recompiling. |
| `createdFiles.lst` | Lists any brand-new files that were generated during compilation. Empty here because no new files were produced. |

---

### Summary — the full picture

```
target/
├── classes/                    ← What gets packaged into the .jar and run
│   ├── application.properties  ← Runtime config (copied from src/main/resources)
│   └── com/scribehealth/       ← Compiled bytecode
├── test-classes/               ← Compiled test bytecode (empty — no tests yet)
├── generated-sources/
│   └── annotations/            ← Annotation-processor output (empty here)
└── maven-status/
    └── maven-compiler-plugin/
        └── compile/default-compile/
            ├── inputFiles.lst  ← Build cache: what was compiled last time
            └── createdFiles.lst← Build cache: what new files were created
```

Drool3008: describe what this file does

GitHub Copilot: ## `pom.xml` — Project Object Model

This is **Maven's configuration file** for the entire backend. It's the single source of truth that tells Maven *what* your project is, *what it needs*, and *how to build it*.

---

### 1. Project Identity
```xml
<groupId>com.scribehealth</groupId>
<artifactId>scribehealth-backend</artifactId>
<version>0.0.1-SNAPSHOT</version>
```
- **groupId** — your organization's namespace (like a Java package)
- **artifactId** — the name of this specific project/module
- **version** — `SNAPSHOT` means it's still in development, not a stable release

---

### 2. Parent — Spring Boot Starter
```xml
<parent>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.4</version>
</parent>
```
Inherits a massive pre-configured `pom.xml` from Spring Boot. This gives you **free dependency version management** — you don't have to specify versions for most Spring libraries because the parent already pins compatible versions together.

---

### 3. Properties
```xml
<java.version>17</java.version>
<jjwt.version>0.12.5</jjwt.version>
```
Reusable variables. `java.version` tells Maven to compile with Java 17. `jjwt.version` is referenced later as `${jjwt.version}` so you only need to update the JWT version in one place.

---

### 4. Dependencies — what libraries get pulled in

| Dependency | What it provides |
|---|---|
| `spring-boot-starter-web` | Embedded Tomcat server + REST API support |
| `spring-boot-starter-security` | Spring Security — authentication, filters, password encoding |
| `spring-boot-starter-data-mongodb` | MongoDB driver + Spring Data repositories |
| `spring-boot-starter-validation` | `@NotBlank`, `@Email`, `@NotNull` annotations on DTOs |
| `jjwt-api` | JWT interface — what your code compiles against |
| `jjwt-impl` | JWT runtime implementation (scope: `runtime` — not needed at compile time) |
| `jjwt-jackson` | JWT JSON serialization via Jackson (scope: `runtime`) |
| `spring-boot-starter-test` | JUnit + Mockito for unit tests (scope: `test` — not in final jar) |
| `spring-security-test` | Security-aware test helpers (scope: `test`) |

> **`scope`** controls when a dependency is available:
> - No scope / `compile` → always available
> - `runtime` → only when actually running, not needed to write code
> - `test` → only during testing, excluded from the final build

---

### 5. Build Plugin
```xml
<plugin>
    <artifactId>spring-boot-maven-plugin</artifactId>
</plugin>
```
This enables `mvn package` to produce a **fat/uber JAR** — a single self-contained `.jar` file that includes your code *plus all its dependencies*, so you can run the whole app with just `java -jar scribehealth-backend.jar`.

Created [](file:///Users/d400l/Desktop/SE-P3/scribehealth-ai-project3/.gitignore)

Created .gitignore at the project root. Here's what it covers:

| Section | What it ignores |
|---|---|
| **Maven** | `target/` — all compiled output, no point committing bytecode |
| **Java** | `.class`, `.jar`, `.war` and other build artifacts |
| **Spring Boot** | Local/secret `application-*.properties` files so credentials don't leak |
| **IntelliJ** | `.idea/`, `.iml` — IDE-specific files that differ per developer |
| **VS Code** | `.vscode/` workspace settings |
| **macOS** | `.DS_Store` — Finder metadata files |
| **Secrets** | `.env`, `*.pem`, `*.key` — never commit credentials or private keys |

You may also want to run this to stop tracking `target/` if it was already committed:
```
git rm -r --cached backend/java/target/
```
### JWT SECRET  = scribehealth_jwt_super_secret_key_2026_do_not_share_xK9mP3qL8nR5wT2v

Email:    admin@scribehealth.com
Password: Admin@12345

## startup - 
``` java
    cd backend/java
    mvn spring-boot:run -Dspring-boot.run.profiles=local
```